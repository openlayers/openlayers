/**
 * @module ol/renderer/canvas/ImageLayer
 */
import _ol_ from '../../index.js';
import _ol_ImageCanvas_ from '../../ImageCanvas.js';
import _ol_LayerType_ from '../../LayerType.js';
import _ol_ViewHint_ from '../../ViewHint.js';
import _ol_array_ from '../../array.js';
import _ol_extent_ from '../../extent.js';
import _ol_layer_VectorRenderType_ from '../../layer/VectorRenderType.js';
import _ol_obj_ from '../../obj.js';
import _ol_plugins_ from '../../plugins.js';
import _ol_renderer_Type_ from '../Type.js';
import _ol_renderer_canvas_IntermediateCanvas_ from '../canvas/IntermediateCanvas.js';
import _ol_transform_ from '../../transform.js';

/**
 * @constructor
 * @extends {ol.renderer.canvas.IntermediateCanvas}
 * @param {ol.layer.Image} imageLayer Single image layer.
 * @api
 */
var _ol_renderer_canvas_ImageLayer_ = function(imageLayer) {

  _ol_renderer_canvas_IntermediateCanvas_.call(this, imageLayer);

  /**
   * @private
   * @type {?ol.ImageBase}
   */
  this.image_ = null;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.imageTransform_ = _ol_transform_.create();

  /**
   * @type {!Array.<string>}
   */
  this.skippedFeatures_ = [];

  /**
   * @private
   * @type {ol.renderer.canvas.VectorLayer}
   */
  this.vectorRenderer_ = null;

};

_ol_.inherits(_ol_renderer_canvas_ImageLayer_, _ol_renderer_canvas_IntermediateCanvas_);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
_ol_renderer_canvas_ImageLayer_['handles'] = function(type, layer) {
  return type === _ol_renderer_Type_.CANVAS && (layer.getType() === _ol_LayerType_.IMAGE ||
      layer.getType() === _ol_LayerType_.VECTOR &&
      /** @type {ol.layer.Vector} */ (layer).getRenderMode() === _ol_layer_VectorRenderType_.IMAGE);
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.canvas.ImageLayer} The layer renderer.
 */
_ol_renderer_canvas_ImageLayer_['create'] = function(mapRenderer, layer) {
  var renderer = new _ol_renderer_canvas_ImageLayer_(/** @type {ol.layer.Image} */ (layer));
  if (layer.getType() === _ol_LayerType_.VECTOR) {
    var candidates = _ol_plugins_.getLayerRendererPlugins();
    for (var i = 0, ii = candidates.length; i < ii; ++i) {
      var candidate = /** @type {Object.<string, Function>} */ (candidates[i]);
      if (candidate !== _ol_renderer_canvas_ImageLayer_ && candidate['handles'](_ol_renderer_Type_.CANVAS, layer)) {
        renderer.setVectorRenderer(candidate['create'](mapRenderer, layer));
      }
    }
  }
  return renderer;
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_ImageLayer_.prototype.getImage = function() {
  return !this.image_ ? null : this.image_.getImage();
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_ImageLayer_.prototype.getImageTransform = function() {
  return this.imageTransform_;
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_ImageLayer_.prototype.prepareFrame = function(frameState, layerState) {

  var pixelRatio = frameState.pixelRatio;
  var size = frameState.size;
  var viewState = frameState.viewState;
  var viewCenter = viewState.center;
  var viewResolution = viewState.resolution;

  var image;
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
    var vectorRenderer = this.vectorRenderer_;
    if (vectorRenderer) {
      var context = vectorRenderer.context;
      var imageFrameState = /** @type {olx.FrameState} */ (_ol_obj_.assign({}, frameState, {
        size: [
          _ol_extent_.getWidth(renderedExtent) / viewResolution,
          _ol_extent_.getHeight(renderedExtent) / viewResolution
        ],
        viewState: /** @type {olx.ViewState} */ (_ol_obj_.assign({}, frameState.viewState, {
          rotation: 0
        }))
      }));
      var skippedFeatures = Object.keys(imageFrameState.skippedFeatureUids).sort();
      if (vectorRenderer.prepareFrame(imageFrameState, layerState) &&
          (vectorRenderer.replayGroupChanged ||
          !_ol_array_.equals(skippedFeatures, this.skippedFeatures_))) {
        context.canvas.width = imageFrameState.size[0] * pixelRatio;
        context.canvas.height = imageFrameState.size[1] * pixelRatio;
        vectorRenderer.composeFrame(imageFrameState, layerState, context);
        this.image_ = new _ol_ImageCanvas_(renderedExtent, viewResolution, pixelRatio, context.canvas);
        this.skippedFeatures_ = skippedFeatures;
      }
    } else {
      image = imageSource.getImage(
          renderedExtent, viewResolution, pixelRatio, projection);
      if (image) {
        var loaded = this.loadImage(image);
        if (loaded) {
          this.image_ = image;
        }
      }
    }
  }

  if (this.image_) {
    image = this.image_;
    var imageExtent = image.getExtent();
    var imageResolution = image.getResolution();
    var imagePixelRatio = image.getPixelRatio();
    var scale = pixelRatio * imageResolution /
        (viewResolution * imagePixelRatio);
    var transform = _ol_transform_.compose(this.imageTransform_,
        pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
        scale, scale,
        0,
        imagePixelRatio * (imageExtent[0] - viewCenter[0]) / imageResolution,
        imagePixelRatio * (viewCenter[1] - imageExtent[3]) / imageResolution);
    _ol_transform_.compose(this.coordinateToCanvasPixelTransform,
        pixelRatio * size[0] / 2 - transform[4], pixelRatio * size[1] / 2 - transform[5],
        pixelRatio / viewResolution, -pixelRatio / viewResolution,
        0,
        -viewCenter[0], -viewCenter[1]);

    this.updateLogos(frameState, imageSource);
    this.renderedResolution = imageResolution * pixelRatio / imagePixelRatio;
  }

  return !!this.image_;
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_ImageLayer_.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  if (this.vectorRenderer_) {
    return this.vectorRenderer_.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg);
  } else {
    return _ol_renderer_canvas_IntermediateCanvas_.prototype.forEachFeatureAtCoordinate.call(this, coordinate, frameState, hitTolerance, callback, thisArg);
  }
};


/**
 * @param {ol.renderer.canvas.VectorLayer} renderer Vector renderer.
 */
_ol_renderer_canvas_ImageLayer_.prototype.setVectorRenderer = function(renderer) {
  this.vectorRenderer_ = renderer;
};
export default _ol_renderer_canvas_ImageLayer_;
