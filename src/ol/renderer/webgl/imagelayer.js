import _ol_ from '../../index';
import _ol_LayerType_ from '../../layertype';
import _ol_ViewHint_ from '../../viewhint';
import _ol_dom_ from '../../dom';
import _ol_extent_ from '../../extent';
import _ol_functions_ from '../../functions';
import _ol_renderer_Type_ from '../type';
import _ol_renderer_webgl_Layer_ from '../webgl/layer';
import _ol_source_ImageVector_ from '../../source/imagevector';
import _ol_transform_ from '../../transform';
import _ol_webgl_ from '../../webgl';
import _ol_webgl_Context_ from '../../webgl/context';

/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Image} imageLayer Tile layer.
 * @api
 */
var _ol_renderer_webgl_ImageLayer_ = function(mapRenderer, imageLayer) {

  _ol_renderer_webgl_Layer_.call(this, mapRenderer, imageLayer);

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

_ol_.inherits(_ol_renderer_webgl_ImageLayer_, _ol_renderer_webgl_Layer_);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
_ol_renderer_webgl_ImageLayer_['handles'] = function(type, layer) {
  return type === _ol_renderer_Type_.WEBGL && layer.getType() === _ol_LayerType_.IMAGE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.webgl.ImageLayer} The layer renderer.
 */
_ol_renderer_webgl_ImageLayer_['create'] = function(mapRenderer, layer) {
  return new _ol_renderer_webgl_ImageLayer_(
      /** @type {ol.renderer.webgl.Map} */ (mapRenderer),
      /** @type {ol.layer.Image} */ (layer)
  );
};


/**
 * @param {ol.ImageBase} image Image.
 * @private
 * @return {WebGLTexture} Texture.
 */
_ol_renderer_webgl_ImageLayer_.prototype.createTexture_ = function(image) {

  // We meet the conditions to work with non-power of two textures.
  // http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
  // http://learningwebgl.com/blog/?p=2101

  var imageElement = image.getImage();
  var gl = this.mapRenderer.getGL();

  return _ol_webgl_Context_.createTexture(
      gl, imageElement, _ol_webgl_.CLAMP_TO_EDGE, _ol_webgl_.CLAMP_TO_EDGE);
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_ImageLayer_.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  var layer = this.getLayer();
  var source = layer.getSource();
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var skippedFeatureUids = frameState.skippedFeatureUids;
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
_ol_renderer_webgl_ImageLayer_.prototype.prepareFrame = function(frameState, layerState, context) {

  var gl = this.mapRenderer.getGL();

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var viewCenter = viewState.center;
  var viewResolution = viewState.resolution;
  var viewRotation = viewState.rotation;

  var image = this.image_;
  var texture = this.texture;
  var imageLayer = /** @type {ol.layer.Image} */ (this.getLayer());
  var imageSource = imageLayer.getSource();

  var hints = frameState.viewHints;

  var renderedExtent = frameState.extent;
  if (layerState.extent !== undefined) {
    renderedExtent = _ol_extent_.getIntersection(
        renderedExtent, layerState.extent);
  }
  if (!hints[_ol_ViewHint_.ANIMATING] && !hints[_ol_ViewHint_.INTERACTING] &&
      !_ol_extent_.isEmpty(renderedExtent)) {
    var projection = viewState.projection;
    if (!_ol_.ENABLE_RASTER_REPROJECTION) {
      var sourceProjection = imageSource.getProjection();
      if (sourceProjection) {
        projection = sourceProjection;
      }
    }
    var image_ = imageSource.getImage(renderedExtent, viewResolution,
        pixelRatio, projection);
    if (image_) {
      var loaded = this.loadImage(image_);
      if (loaded) {
        image = image_;
        texture = this.createTexture_(image_);
        if (this.texture) {
          /**
           * @param {WebGLRenderingContext} gl GL.
           * @param {WebGLTexture} texture Texture.
           */
          var postRenderFunction = function(gl, texture) {
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
    var canvas = this.mapRenderer.getContext().getCanvas();

    this.updateProjectionMatrix_(canvas.width, canvas.height,
        pixelRatio, viewCenter, viewResolution, viewRotation,
        image.getExtent());
    this.hitTransformationMatrix_ = null;

    // Translate and scale to flip the Y coord.
    var texCoordMatrix = this.texCoordMatrix;
    _ol_transform_.reset(texCoordMatrix);
    _ol_transform_.scale(texCoordMatrix, 1, -1);
    _ol_transform_.translate(texCoordMatrix, 0, -1);

    this.image_ = image;
    this.texture = texture;

    this.updateAttributions(frameState.attributions, image.getAttributions());
    this.updateLogos(frameState, imageSource);
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
_ol_renderer_webgl_ImageLayer_.prototype.updateProjectionMatrix_ = function(canvasWidth, canvasHeight, pixelRatio,
    viewCenter, viewResolution, viewRotation, imageExtent) {

  var canvasExtentWidth = canvasWidth * viewResolution;
  var canvasExtentHeight = canvasHeight * viewResolution;

  var projectionMatrix = this.projectionMatrix;
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
_ol_renderer_webgl_ImageLayer_.prototype.hasFeatureAtCoordinate = function(coordinate, frameState) {
  var hasFeature = this.forEachFeatureAtCoordinate(
      coordinate, frameState, 0, _ol_functions_.TRUE, this);
  return hasFeature !== undefined;
};


/**
 * @inheritDoc
 */
_ol_renderer_webgl_ImageLayer_.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {
  if (!this.image_ || !this.image_.getImage()) {
    return undefined;
  }

  if (this.getLayer().getSource() instanceof _ol_source_ImageVector_) {
    // for ImageVector sources use the original hit-detection logic,
    // so that for example also transparent polygons are detected
    var coordinate = _ol_transform_.apply(
        frameState.pixelToCoordinateTransform, pixel.slice());
    var hasFeature = this.forEachFeatureAtCoordinate(
        coordinate, frameState, 0, _ol_functions_.TRUE, this);

    if (hasFeature) {
      return callback.call(thisArg, this.getLayer(), null);
    } else {
      return undefined;
    }
  } else {
    var imageSize =
        [this.image_.getImage().width, this.image_.getImage().height];

    if (!this.hitTransformationMatrix_) {
      this.hitTransformationMatrix_ = this.getHitTransformationMatrix_(
          frameState.size, imageSize);
    }

    var pixelOnFrameBuffer = _ol_transform_.apply(
        this.hitTransformationMatrix_, pixel.slice());

    if (pixelOnFrameBuffer[0] < 0 || pixelOnFrameBuffer[0] > imageSize[0] ||
        pixelOnFrameBuffer[1] < 0 || pixelOnFrameBuffer[1] > imageSize[1]) {
      // outside the image, no need to check
      return undefined;
    }

    if (!this.hitCanvasContext_) {
      this.hitCanvasContext_ = _ol_dom_.createCanvasContext2D(1, 1);
    }

    this.hitCanvasContext_.clearRect(0, 0, 1, 1);
    this.hitCanvasContext_.drawImage(this.image_.getImage(),
        pixelOnFrameBuffer[0], pixelOnFrameBuffer[1], 1, 1, 0, 0, 1, 1);

    var imageData = this.hitCanvasContext_.getImageData(0, 0, 1, 1).data;
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
_ol_renderer_webgl_ImageLayer_.prototype.getHitTransformationMatrix_ = function(mapSize, imageSize) {
  // the first matrix takes a map pixel, flips the y-axis and scales to
  // a range between -1 ... 1
  var mapCoordTransform = _ol_transform_.create();
  _ol_transform_.translate(mapCoordTransform, -1, -1);
  _ol_transform_.scale(mapCoordTransform, 2 / mapSize[0], 2 / mapSize[1]);
  _ol_transform_.translate(mapCoordTransform, 0, mapSize[1]);
  _ol_transform_.scale(mapCoordTransform, 1, -1);

  // the second matrix is the inverse of the projection matrix used in the
  // shader for drawing
  var projectionMatrixInv = _ol_transform_.invert(this.projectionMatrix.slice());

  // the third matrix scales to the image dimensions and flips the y-axis again
  var transform = _ol_transform_.create();
  _ol_transform_.translate(transform, 0, imageSize[1]);
  _ol_transform_.scale(transform, 1, -1);
  _ol_transform_.scale(transform, imageSize[0] / 2, imageSize[1] / 2);
  _ol_transform_.translate(transform, 1, 1);

  _ol_transform_.multiply(transform, projectionMatrixInv);
  _ol_transform_.multiply(transform, mapCoordTransform);

  return transform;
};
export default _ol_renderer_webgl_ImageLayer_;
