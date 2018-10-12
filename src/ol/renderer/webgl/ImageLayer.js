/**
 * @module ol/renderer/webgl/ImageLayer
 */
import {ENABLE_RASTER_REPROJECTION} from '../../reproj/common.js';
import LayerType from '../../LayerType.js';
import ViewHint from '../../ViewHint.js';
import {createCanvasContext2D} from '../../dom.js';
import {getIntersection, isEmpty} from '../../extent.js';
import WebGLLayerRenderer from './Layer.js';
import {
  create as createTransform,
  rotate as rotateTransform,
  translate as translateTransform,
  scale as scaleTransform,
  reset as resetTransform,
  apply as applyTransform,
  invert as invertTransform,
  multiply as multiplyTransform
} from '../../transform.js';
import {CLAMP_TO_EDGE} from '../../webgl.js';
import {createTexture} from '../../webgl/Context.js';

/**
 * @classdesc
 * WebGL renderer for image layers.
 * @api
 */
class WebGLImageLayerRenderer extends WebGLLayerRenderer {

  /**
   * @param {import("./Map.js").default} mapRenderer Map renderer.
   * @param {import("../../layer/Image.js").default} imageLayer Tile layer.
   */
  constructor(mapRenderer, imageLayer) {

    super(mapRenderer, imageLayer);

    /**
     * The last rendered image.
     * @private
     * @type {?import("../../ImageBase.js").default}
     */
    this.image_ = null;

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.hitCanvasContext_ = null;

    /**
     * @private
     * @type {?import("../../transform.js").Transform}
     */
    this.hitTransformationMatrix_ = null;

  }

  /**
   * @param {import("../../ImageBase.js").default} image Image.
   * @private
   * @return {WebGLTexture} Texture.
   */
  createTexture_(image) {

    // We meet the conditions to work with non-power of two textures.
    // http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
    // http://learningwebgl.com/blog/?p=2101

    const imageElement = image.getImage();
    const gl = this.mapRenderer.getGL();

    return createTexture(
      gl, imageElement, CLAMP_TO_EDGE, CLAMP_TO_EDGE);
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState, context) {

    const gl = this.mapRenderer.getGL();

    const pixelRatio = frameState.pixelRatio;
    const viewState = frameState.viewState;
    const viewCenter = viewState.center;
    const viewResolution = viewState.resolution;
    const viewRotation = viewState.rotation;

    let image = this.image_;
    let texture = this.texture;
    const imageLayer = /** @type {import("../../layer/Image.js").default} */ (this.getLayer());
    const imageSource = /** @type {import("../../source/Image.js").default} */ (imageLayer.getSource());

    const hints = frameState.viewHints;

    let renderedExtent = frameState.extent;
    if (layerState.extent !== undefined) {
      renderedExtent = getIntersection(renderedExtent, layerState.extent);
    }
    if (!hints[ViewHint.ANIMATING] && !hints[ViewHint.INTERACTING] &&
        !isEmpty(renderedExtent)) {
      let projection = viewState.projection;
      if (!ENABLE_RASTER_REPROJECTION) {
        const sourceProjection = imageSource.getProjection();
        if (sourceProjection) {
          projection = sourceProjection;
        }
      }
      const image_ = imageSource.getImage(renderedExtent, viewResolution,
        pixelRatio, projection);
      if (image_) {
        const loaded = this.loadImage(image_);
        if (loaded) {
          image = image_;
          texture = this.createTexture_(image_);
          if (this.texture) {
            /**
             * @param {WebGLRenderingContext} gl GL.
             * @param {WebGLTexture} texture Texture.
             */
            const postRenderFunction = function(gl, texture) {
              if (!gl.isContextLost()) {
                gl.deleteTexture(texture);
              }
            }.bind(null, gl, this.texture);
            frameState.postRenderFunctions.push(
              /** @type {import("../../PluggableMap.js").PostRenderFunction} */ (postRenderFunction)
            );
          }
        }
      }
    }

    if (image) {
      const canvas = this.mapRenderer.getContext().getCanvas();

      this.updateProjectionMatrix_(canvas.width, canvas.height,
        pixelRatio, viewCenter, viewResolution, viewRotation,
        image.getExtent());
      this.hitTransformationMatrix_ = null;

      // Translate and scale to flip the Y coord.
      const texCoordMatrix = this.texCoordMatrix;
      resetTransform(texCoordMatrix);
      scaleTransform(texCoordMatrix, 1, -1);
      translateTransform(texCoordMatrix, 0, -1);

      this.image_ = image;
      this.texture = texture;
    }

    return !!image;
  }

  /**
   * @param {number} canvasWidth Canvas width.
   * @param {number} canvasHeight Canvas height.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../coordinate.js").Coordinate} viewCenter View center.
   * @param {number} viewResolution View resolution.
   * @param {number} viewRotation View rotation.
   * @param {import("../../extent.js").Extent} imageExtent Image extent.
   * @private
   */
  updateProjectionMatrix_(
    canvasWidth,
    canvasHeight,
    pixelRatio,
    viewCenter,
    viewResolution,
    viewRotation,
    imageExtent
  ) {

    const canvasExtentWidth = canvasWidth * viewResolution;
    const canvasExtentHeight = canvasHeight * viewResolution;

    const projectionMatrix = this.projectionMatrix;
    resetTransform(projectionMatrix);
    scaleTransform(projectionMatrix,
      pixelRatio * 2 / canvasExtentWidth,
      pixelRatio * 2 / canvasExtentHeight);
    rotateTransform(projectionMatrix, -viewRotation);
    translateTransform(projectionMatrix,
      imageExtent[0] - viewCenter[0],
      imageExtent[1] - viewCenter[1]);
    scaleTransform(projectionMatrix,
      (imageExtent[2] - imageExtent[0]) / 2,
      (imageExtent[3] - imageExtent[1]) / 2);
    translateTransform(projectionMatrix, 1, 1);

  }

  /**
   * @inheritDoc
   */
  forEachLayerAtPixel(pixel, frameState, callback, thisArg) {
    if (!this.image_ || !this.image_.getImage()) {
      return undefined;
    }

    const imageSize =
        [this.image_.getImage().width, this.image_.getImage().height];

    if (!this.hitTransformationMatrix_) {
      this.hitTransformationMatrix_ = this.getHitTransformationMatrix_(
        frameState.size, imageSize);
    }

    const pixelOnFrameBuffer = applyTransform(
      this.hitTransformationMatrix_, pixel.slice());

    if (pixelOnFrameBuffer[0] < 0 || pixelOnFrameBuffer[0] > imageSize[0] ||
        pixelOnFrameBuffer[1] < 0 || pixelOnFrameBuffer[1] > imageSize[1]) {
      // outside the image, no need to check
      return undefined;
    }

    if (!this.hitCanvasContext_) {
      this.hitCanvasContext_ = createCanvasContext2D(1, 1);
    }

    this.hitCanvasContext_.clearRect(0, 0, 1, 1);
    this.hitCanvasContext_.drawImage(this.image_.getImage(),
      pixelOnFrameBuffer[0], pixelOnFrameBuffer[1], 1, 1, 0, 0, 1, 1);

    const imageData = this.hitCanvasContext_.getImageData(0, 0, 1, 1).data;
    if (imageData[3] > 0) {
      return callback.call(thisArg, this.getLayer(), imageData);
    } else {
      return undefined;
    }
  }

  /**
   * The transformation matrix to get the pixel on the image for a
   * pixel on the map.
   * @param {import("../../size.js").Size} mapSize The map size.
   * @param {import("../../size.js").Size} imageSize The image size.
   * @return {import("../../transform.js").Transform} The transformation matrix.
   * @private
   */
  getHitTransformationMatrix_(mapSize, imageSize) {
    // the first matrix takes a map pixel, flips the y-axis and scales to
    // a range between -1 ... 1
    const mapCoordTransform = createTransform();
    translateTransform(mapCoordTransform, -1, -1);
    scaleTransform(mapCoordTransform, 2 / mapSize[0], 2 / mapSize[1]);
    translateTransform(mapCoordTransform, 0, mapSize[1]);
    scaleTransform(mapCoordTransform, 1, -1);

    // the second matrix is the inverse of the projection matrix used in the
    // shader for drawing
    const projectionMatrixInv = invertTransform(this.projectionMatrix.slice());

    // the third matrix scales to the image dimensions and flips the y-axis again
    const transform = createTransform();
    translateTransform(transform, 0, imageSize[1]);
    scaleTransform(transform, 1, -1);
    scaleTransform(transform, imageSize[0] / 2, imageSize[1] / 2);
    translateTransform(transform, 1, 1);

    multiplyTransform(transform, projectionMatrixInv);
    multiplyTransform(transform, mapCoordTransform);

    return transform;
  }
}


/**
 * Determine if this renderer handles the provided layer.
 * @param {import("../../layer/Layer.js").default} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
WebGLImageLayerRenderer['handles'] = function(layer) {
  return layer.getType() === LayerType.IMAGE;
};


/**
 * Create a layer renderer.
 * @param {import("../Map.js").default} mapRenderer The map renderer.
 * @param {import("../../layer/Layer.js").default} layer The layer to be rendererd.
 * @return {WebGLImageLayerRenderer} The layer renderer.
 */
WebGLImageLayerRenderer['create'] = function(mapRenderer, layer) {
  return new WebGLImageLayerRenderer(
    /** @type {import("./Map.js").default} */ (mapRenderer),
    /** @type {import("../../layer/Image.js").default} */ (layer)
  );
};


export default WebGLImageLayerRenderer;
