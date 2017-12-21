/**
 * @module ol/renderer/canvas/Layer
 */
import {inherits} from '../../index.js';
import {getBottomLeft, getBottomRight, getTopLeft, getTopRight} from '../../extent.js';
import {TRUE} from '../../functions.js';
import _ol_render_Event_ from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import _ol_render_canvas_ from '../../render/canvas.js';
import _ol_render_canvas_Immediate_ from '../../render/canvas/Immediate.js';
import _ol_renderer_Layer_ from '../Layer.js';
import _ol_transform_ from '../../transform.js';

/**
 * @constructor
 * @abstract
 * @extends {ol.renderer.Layer}
 * @param {ol.layer.Layer} layer Layer.
 */
var _ol_renderer_canvas_Layer_ = function(layer) {

  _ol_renderer_Layer_.call(this, layer);

  /**
   * @protected
   * @type {number}
   */
  this.renderedResolution;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.transform_ = _ol_transform_.create();

};

inherits(_ol_renderer_canvas_Layer_, _ol_renderer_Layer_);


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Extent} extent Clip extent.
 * @protected
 */
_ol_renderer_canvas_Layer_.prototype.clip = function(context, frameState, extent) {
  var pixelRatio = frameState.pixelRatio;
  var width = frameState.size[0] * pixelRatio;
  var height = frameState.size[1] * pixelRatio;
  var rotation = frameState.viewState.rotation;
  var topLeft = getTopLeft(/** @type {ol.Extent} */ (extent));
  var topRight = getTopRight(/** @type {ol.Extent} */ (extent));
  var bottomRight = getBottomRight(/** @type {ol.Extent} */ (extent));
  var bottomLeft = getBottomLeft(/** @type {ol.Extent} */ (extent));

  _ol_transform_.apply(frameState.coordinateToPixelTransform, topLeft);
  _ol_transform_.apply(frameState.coordinateToPixelTransform, topRight);
  _ol_transform_.apply(frameState.coordinateToPixelTransform, bottomRight);
  _ol_transform_.apply(frameState.coordinateToPixelTransform, bottomLeft);

  context.save();
  _ol_render_canvas_.rotateAtOffset(context, -rotation, width / 2, height / 2);
  context.beginPath();
  context.moveTo(topLeft[0] * pixelRatio, topLeft[1] * pixelRatio);
  context.lineTo(topRight[0] * pixelRatio, topRight[1] * pixelRatio);
  context.lineTo(bottomRight[0] * pixelRatio, bottomRight[1] * pixelRatio);
  context.lineTo(bottomLeft[0] * pixelRatio, bottomLeft[1] * pixelRatio);
  context.clip();
  _ol_render_canvas_.rotateAtOffset(context, rotation, width / 2, height / 2);
};


/**
 * @param {ol.render.EventType} type Event type.
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @private
 */
_ol_renderer_canvas_Layer_.prototype.dispatchComposeEvent_ = function(type, context, frameState, opt_transform) {
  var layer = this.getLayer();
  if (layer.hasListener(type)) {
    var width = frameState.size[0] * frameState.pixelRatio;
    var height = frameState.size[1] * frameState.pixelRatio;
    var rotation = frameState.viewState.rotation;
    _ol_render_canvas_.rotateAtOffset(context, -rotation, width / 2, height / 2);
    var transform = opt_transform !== undefined ?
      opt_transform : this.getTransform(frameState, 0);
    var render = new _ol_render_canvas_Immediate_(
        context, frameState.pixelRatio, frameState.extent, transform,
        frameState.viewState.rotation);
    var composeEvent = new _ol_render_Event_(type, render, frameState,
        context, null);
    layer.dispatchEvent(composeEvent);
    _ol_render_canvas_.rotateAtOffset(context, rotation, width / 2, height / 2);
  }
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState FrameState.
 * @param {number} hitTolerance Hit tolerance in pixels.
 * @param {function(this: S, ol.layer.Layer, (Uint8ClampedArray|Uint8Array)): T} callback Layer
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
_ol_renderer_canvas_Layer_.prototype.forEachLayerAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  var hasFeature = this.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, TRUE, this);

  if (hasFeature) {
    return callback.call(thisArg, this.getLayer(), null);
  } else {
    return undefined;
  }
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
_ol_renderer_canvas_Layer_.prototype.postCompose = function(context, frameState, layerState, opt_transform) {
  this.dispatchComposeEvent_(RenderEventType.POSTCOMPOSE, context, frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
_ol_renderer_canvas_Layer_.prototype.preCompose = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(RenderEventType.PRECOMPOSE, context, frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
_ol_renderer_canvas_Layer_.prototype.dispatchRenderEvent = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(RenderEventType.RENDER, context, frameState, opt_transform);
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {number} offsetX Offset on the x-axis in view coordinates.
 * @protected
 * @return {!ol.Transform} Transform.
 */
_ol_renderer_canvas_Layer_.prototype.getTransform = function(frameState, offsetX) {
  var viewState = frameState.viewState;
  var pixelRatio = frameState.pixelRatio;
  var dx1 = pixelRatio * frameState.size[0] / 2;
  var dy1 = pixelRatio * frameState.size[1] / 2;
  var sx = pixelRatio / viewState.resolution;
  var sy = -sx;
  var angle = -viewState.rotation;
  var dx2 = -viewState.center[0] + offsetX;
  var dy2 = -viewState.center[1];
  return _ol_transform_.compose(this.transform_, dx1, dy1, sx, sy, angle, dx2, dy2);
};


/**
 * @abstract
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {CanvasRenderingContext2D} context Context.
 */
_ol_renderer_canvas_Layer_.prototype.composeFrame = function(frameState, layerState, context) {};

/**
 * @abstract
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @return {boolean} whether composeFrame should be called.
 */
_ol_renderer_canvas_Layer_.prototype.prepareFrame = function(frameState, layerState) {};
export default _ol_renderer_canvas_Layer_;
