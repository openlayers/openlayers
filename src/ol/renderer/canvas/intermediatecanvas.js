import _ol_ from '../../index';
import _ol_coordinate_ from '../../coordinate';
import _ol_dom_ from '../../dom';
import _ol_extent_ from '../../extent';
import _ol_renderer_canvas_Layer_ from '../canvas/layer';
import _ol_transform_ from '../../transform';

/**
 * @constructor
 * @abstract
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.Layer} layer Layer.
 */
var _ol_renderer_canvas_IntermediateCanvas_ = function(layer) {

  _ol_renderer_canvas_Layer_.call(this, layer);

  /**
   * @protected
   * @type {ol.Transform}
   */
  this.coordinateToCanvasPixelTransform = _ol_transform_.create();

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.hitCanvasContext_ = null;

};

_ol_.inherits(_ol_renderer_canvas_IntermediateCanvas_, _ol_renderer_canvas_Layer_);


/**
 * @inheritDoc
 */
_ol_renderer_canvas_IntermediateCanvas_.prototype.composeFrame = function(frameState, layerState, context) {

  this.preCompose(context, frameState);

  var image = this.getImage();
  if (image) {

    // clipped rendering if layer extent is set
    var extent = layerState.extent;
    var clipped = extent !== undefined &&
        !_ol_extent_.containsExtent(extent, frameState.extent) &&
        _ol_extent_.intersects(extent, frameState.extent);
    if (clipped) {
      this.clip(context, frameState, /** @type {ol.Extent} */ (extent));
    }

    var imageTransform = this.getImageTransform();
    // for performance reasons, context.save / context.restore is not used
    // to save and restore the transformation matrix and the opacity.
    // see http://jsperf.com/context-save-restore-versus-variable
    var alpha = context.globalAlpha;
    context.globalAlpha = layerState.opacity;

    // for performance reasons, context.setTransform is only used
    // when the view is rotated. see http://jsperf.com/canvas-transform
    var dx = imageTransform[4];
    var dy = imageTransform[5];
    var dw = image.width * imageTransform[0];
    var dh = image.height * imageTransform[3];
    context.drawImage(image, 0, 0, +image.width, +image.height,
        Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    context.globalAlpha = alpha;

    if (clipped) {
      context.restore();
    }
  }

  this.postCompose(context, frameState, layerState);
};


/**
 * @abstract
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Canvas.
 */
_ol_renderer_canvas_IntermediateCanvas_.prototype.getImage = function() {};


/**
 * @abstract
 * @return {!ol.Transform} Image transform.
 */
_ol_renderer_canvas_IntermediateCanvas_.prototype.getImageTransform = function() {};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_IntermediateCanvas_.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
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
_ol_renderer_canvas_IntermediateCanvas_.prototype.forEachLayerAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  if (!this.getImage()) {
    return undefined;
  }

  if (this.getLayer().getSource().forEachFeatureAtCoordinate !== _ol_.nullFunction) {
    // for ImageVector sources use the original hit-detection logic,
    // so that for example also transparent polygons are detected
    return _ol_renderer_canvas_Layer_.prototype.forEachLayerAtCoordinate.apply(this, arguments);
  } else {
    var pixel = _ol_transform_.apply(this.coordinateToCanvasPixelTransform, coordinate.slice());
    _ol_coordinate_.scale(pixel, frameState.viewState.resolution / this.renderedResolution);

    if (!this.hitCanvasContext_) {
      this.hitCanvasContext_ = _ol_dom_.createCanvasContext2D(1, 1);
    }

    this.hitCanvasContext_.clearRect(0, 0, 1, 1);
    this.hitCanvasContext_.drawImage(this.getImage(), pixel[0], pixel[1], 1, 1, 0, 0, 1, 1);

    var imageData = this.hitCanvasContext_.getImageData(0, 0, 1, 1).data;
    if (imageData[3] > 0) {
      return callback.call(thisArg, this.getLayer(),  imageData);
    } else {
      return undefined;
    }
  }
};
export default _ol_renderer_canvas_IntermediateCanvas_;
