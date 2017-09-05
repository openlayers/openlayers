import _ol_ from '../../index';
import _ol_LayerType_ from '../../layertype';
import _ol_ViewHint_ from '../../viewhint';
import _ol_extent_ from '../../extent';
import _ol_renderer_Type_ from '../type';
import _ol_renderer_canvas_IntermediateCanvas_ from '../canvas/intermediatecanvas';
import _ol_transform_ from '../../transform';

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

};

_ol_.inherits(_ol_renderer_canvas_ImageLayer_, _ol_renderer_canvas_IntermediateCanvas_);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
_ol_renderer_canvas_ImageLayer_['handles'] = function(type, layer) {
  return type === _ol_renderer_Type_.CANVAS && layer.getType() === _ol_LayerType_.IMAGE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.canvas.ImageLayer} The layer renderer.
 */
_ol_renderer_canvas_ImageLayer_['create'] = function(mapRenderer, layer) {
  return new _ol_renderer_canvas_ImageLayer_(/** @type {ol.layer.Image} */ (layer));
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
    image = imageSource.getImage(
        renderedExtent, viewResolution, pixelRatio, projection);
    if (image) {
      var loaded = this.loadImage(image);
      if (loaded) {
        this.image_ = image;
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

    this.updateAttributions(frameState.attributions, image.getAttributions());
    this.updateLogos(frameState, imageSource);
    this.renderedResolution = viewResolution * pixelRatio / imagePixelRatio;
  }

  return !!this.image_;
};
export default _ol_renderer_canvas_ImageLayer_;
