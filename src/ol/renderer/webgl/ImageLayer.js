/**
 * @module ol/renderer/webgl/ImageLayer
 */
import {ENABLE_RASTER_REPROJECTION} from '../../reproj/common.js';
import {inherits, nullFunction} from '../../index.js';
import LayerType from '../../LayerType.js';
import ViewHint from '../../ViewHint.js';
import {createCanvasContext2D} from '../../dom.js';
import {getIntersection, isEmpty} from '../../extent.js';
import {TRUE} from '../../functions.js';
import RendererType from '../Type.js';
import WebGLLayerRenderer from '../webgl/Layer.js';
import _ol_transform_ from '../../transform.js';
import _ol_webgl_ from '../../webgl.js';
import _ol_webgl_Context_ from '../../webgl/Context.js';

/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Image} imageLayer Tile layer.
 * @api
 */
const WebGLImageLayerRenderer = function(mapRenderer, imageLayer) {

  WebGLLayerRenderer.call(this, mapRenderer, imageLayer);

  /**
   * The last rendered image.
   * @private
   * @type {?ol.ImageBase}
   */
  this.image_ = null;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.hitCanvasContext_ = null;

  /**
   * @private
   * @type {?ol.Transform}
   */
  this.hitTransformationMatrix_ = null;

};

inherits(WebGLImageLayerRenderer, WebGLLayerRenderer);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
WebGLImageLayerRenderer['handles'] = function(type, layer) {
  return type === RendererType.WEBGL && layer.getType() === LayerType.IMAGE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.webgl.ImageLayer} The layer renderer.
 */
WebGLImageLayerRenderer['create'] = function(mapRenderer, layer) {
  return new WebGLImageLayerRenderer(
    /** @type {ol.renderer.webgl.Map} */ (mapRenderer),
    /** @type {ol.layer.Image} */ (layer)
  );
};


/**
 * @param {ol.ImageBase} image Image.
 * @private
 * @return {WebGLTexture} Texture.
 */
WebGLImageLayerRenderer.prototype.createTexture_ = function(image) {

  // We meet the conditions to work with non-power of two textures.
  // http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
  // http://learningwebgl.com/blog/?p=2101

  const imageElement = image.getImage();
  const gl = this.mapRenderer.getGL();

  return _ol_webgl_Context_.createTexture(
    gl, imageElement, _ol_webgl_.CLAMP_TO_EDGE, _ol_webgl_.CLAMP_TO_EDGE);
};


/**
 * @inheritDoc
 */
WebGLImageLayerRenderer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  const layer = this.getLayer();
  const source = layer.getSource();
  const resolution = frameState.viewState.resolution;
  const rotation = frameState.viewState.rotation;
  const skippedFeatureUids = frameState.skippedFeatureUids;
  return source.forEachFeatureAtCoordinate(
    coordinate, resolution, rotation, hitTolerance, skippedFeatureUids,

    /**
       * @param {ol.Feature|ol.render.Feature} feature Feature.
       * @return {?} Callback result.
       */
    function(feature) {
      return callback.call(thisArg, feature, layer);
    });
};


/**
 * @inheritDoc
 */
WebGLImageLayerRenderer.prototype.prepareFrame = function(frameState, layerState, context) {

  const gl = this.mapRenderer.getGL();

  const pixelRatio = frameState.pixelRatio;
  const viewState = frameState.viewState;
  const viewCenter = viewState.center;
  const viewResolution = viewState.resolution;
  const viewRotation = viewState.rotation;

  let image = this.image_;
  let texture = this.texture;
  const imageLayer = /** @type {ol.layer.Image} */ (this.getLayer());
  const imageSource = imageLayer.getSource();

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
            /** @type {ol.PostRenderFunction} */ (postRenderFunction)
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
    _ol_transform_.reset(texCoordMatrix);
    _ol_transform_.scale(texCoordMatrix, 1, -1);
    _ol_transform_.translate(texCoordMatrix, 0, -1);

    this.image_ = image;
    this.texture = texture;
  }

  return !!image;
};


/**
 * @param {number} canvasWidth Canvas width.
 * @param {number} canvasHeight Canvas height.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Coordinate} viewCenter View center.
 * @param {number} viewResolution View resolution.
 * @param {number} viewRotation View rotation.
 * @param {ol.Extent} imageExtent Image extent.
 * @private
 */
WebGLImageLayerRenderer.prototype.updateProjectionMatrix_ = function(canvasWidth, canvasHeight, pixelRatio,
  viewCenter, viewResolution, viewRotation, imageExtent) {

  const canvasExtentWidth = canvasWidth * viewResolution;
  const canvasExtentHeight = canvasHeight * viewResolution;

  const projectionMatrix = this.projectionMatrix;
  _ol_transform_.reset(projectionMatrix);
  _ol_transform_.scale(projectionMatrix,
    pixelRatio * 2 / canvasExtentWidth,
    pixelRatio * 2 / canvasExtentHeight);
  _ol_transform_.rotate(projectionMatrix, -viewRotation);
  _ol_transform_.translate(projectionMatrix,
    imageExtent[0] - viewCenter[0],
    imageExtent[1] - viewCenter[1]);
  _ol_transform_.scale(projectionMatrix,
    (imageExtent[2] - imageExtent[0]) / 2,
    (imageExtent[3] - imageExtent[1]) / 2);
  _ol_transform_.translate(projectionMatrix, 1, 1);

};


/**
 * @inheritDoc
 */
WebGLImageLayerRenderer.prototype.hasFeatureAtCoordinate = function(coordinate, frameState) {
  const hasFeature = this.forEachFeatureAtCoordinate(coordinate, frameState, 0, TRUE, this);
  return hasFeature !== undefined;
};


/**
 * @inheritDoc
 */
WebGLImageLayerRenderer.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {
  if (!this.image_ || !this.image_.getImage()) {
    return undefined;
  }

  if (this.getLayer().getSource().forEachFeatureAtCoordinate !== nullFunction) {
    // for ImageCanvas sources use the original hit-detection logic,
    // so that for example also transparent polygons are detected
    const coordinate = _ol_transform_.apply(
      frameState.pixelToCoordinateTransform, pixel.slice());
    const hasFeature = this.forEachFeatureAtCoordinate(coordinate, frameState, 0, TRUE, this);

    if (hasFeature) {
      return callback.call(thisArg, this.getLayer(), null);
    } else {
      return undefined;
    }
  } else {
    const imageSize =
        [this.image_.getImage().width, this.image_.getImage().height];

    if (!this.hitTransformationMatrix_) {
      this.hitTransformationMatrix_ = this.getHitTransformationMatrix_(
        frameState.size, imageSize);
    }

    const pixelOnFrameBuffer = _ol_transform_.apply(
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
      return callback.call(thisArg, this.getLayer(),  imageData);
    } else {
      return undefined;
    }
  }
};


/**
 * The transformation matrix to get the pixel on the image for a
 * pixel on the map.
 * @param {ol.Size} mapSize The map size.
 * @param {ol.Size} imageSize The image size.
 * @return {ol.Transform} The transformation matrix.
 * @private
 */
WebGLImageLayerRenderer.prototype.getHitTransformationMatrix_ = function(mapSize, imageSize) {
  // the first matrix takes a map pixel, flips the y-axis and scales to
  // a range between -1 ... 1
  const mapCoordTransform = _ol_transform_.create();
  _ol_transform_.translate(mapCoordTransform, -1, -1);
  _ol_transform_.scale(mapCoordTransform, 2 / mapSize[0], 2 / mapSize[1]);
  _ol_transform_.translate(mapCoordTransform, 0, mapSize[1]);
  _ol_transform_.scale(mapCoordTransform, 1, -1);

  // the second matrix is the inverse of the projection matrix used in the
  // shader for drawing
  const projectionMatrixInv = _ol_transform_.invert(this.projectionMatrix.slice());

  // the third matrix scales to the image dimensions and flips the y-axis again
  const transform = _ol_transform_.create();
  _ol_transform_.translate(transform, 0, imageSize[1]);
  _ol_transform_.scale(transform, 1, -1);
  _ol_transform_.scale(transform, imageSize[0] / 2, imageSize[1] / 2);
  _ol_transform_.translate(transform, 1, 1);

  _ol_transform_.multiply(transform, projectionMatrixInv);
  _ol_transform_.multiply(transform, mapCoordTransform);

  return transform;
};
export default WebGLImageLayerRenderer;
