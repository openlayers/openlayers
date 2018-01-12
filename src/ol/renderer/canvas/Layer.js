/**
 * @module ol/renderer/canvas/Layer
 */
import {inherits} from '../../index.js';
import {getBottomLeft, getBottomRight, getTopLeft, getTopRight} from '../../extent.js';
import {TRUE} from '../../functions.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import _ol_render_canvas_ from '../../render/canvas.js';
import CanvasImmediateRenderer from '../../render/canvas/Immediate.js';
import LayerRenderer from '../Layer.js';
import _ol_transform_ from '../../transform.js';

/**
 * @constructor
 * @abstract
 * @extends {ol.renderer.Layer}
 * @param {ol.layer.Layer} layer Layer.
 */
const CanvasLayerRenderer = function(layer) {

  LayerRenderer.call(this, layer);

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

inherits(CanvasLayerRenderer, LayerRenderer);


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Extent} extent Clip extent.
 * @protected
 */
CanvasLayerRenderer.prototype.clip = function(context, frameState, extent) {
  const pixelRatio = frameState.pixelRatio;
  const width = frameState.size[0] * pixelRatio;
  const height = frameState.size[1] * pixelRatio;
  const rotation = frameState.viewState.rotation;
  const topLeft = getTopLeft(/** @type {ol.Extent} */ (extent));
  const topRight = getTopRight(/** @type {ol.Extent} */ (extent));
  const bottomRight = getBottomRight(/** @type {ol.Extent} */ (extent));
  const bottomLeft = getBottomLeft(/** @type {ol.Extent} */ (extent));

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
CanvasLayerRenderer.prototype.dispatchComposeEvent_ = function(type, context, frameState, opt_transform) {
  const layer = this.getLayer();
  if (layer.hasListener(type)) {
    const width = frameState.size[0] * frameState.pixelRatio;
    const height = frameState.size[1] * frameState.pixelRatio;
    const rotation = frameState.viewState.rotation;
    _ol_render_canvas_.rotateAtOffset(context, -rotation, width / 2, height / 2);
    const transform = opt_transform !== undefined ?
      opt_transform : this.getTransform(frameState, 0);
    const render = new CanvasImmediateRenderer(
      context, frameState.pixelRatio, frameState.extent, transform,
      frameState.viewState.rotation);
    const composeEvent = new RenderEvent(type, render, frameState,
      context, null);
    layer.dispatchEvent(composeEvent);
    _ol_render_canvas_.rotateAtOffset(context, rotation, width / 2, height / 2);
  }
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState FrameState.
 * @param {function(this: S, ol.layer.Layer, (Uint8ClampedArray|Uint8Array)): T} callback Layer
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
CanvasLayerRenderer.prototype.forEachLayerAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  const hasFeature = this.forEachFeatureAtCoordinate(coordinate, frameState, 0, TRUE, this);

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
CanvasLayerRenderer.prototype.postCompose = function(context, frameState, layerState, opt_transform) {
  this.dispatchComposeEvent_(RenderEventType.POSTCOMPOSE, context, frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
CanvasLayerRenderer.prototype.preCompose = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(RenderEventType.PRECOMPOSE, context, frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
CanvasLayerRenderer.prototype.dispatchRenderEvent = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(RenderEventType.RENDER, context, frameState, opt_transform);
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {number} offsetX Offset on the x-axis in view coordinates.
 * @protected
 * @return {!ol.Transform} Transform.
 */
CanvasLayerRenderer.prototype.getTransform = function(frameState, offsetX) {
  const viewState = frameState.viewState;
  const pixelRatio = frameState.pixelRatio;
  const dx1 = pixelRatio * frameState.size[0] / 2;
  const dy1 = pixelRatio * frameState.size[1] / 2;
  const sx = pixelRatio / viewState.resolution;
  const sy = -sx;
  const angle = -viewState.rotation;
  const dx2 = -viewState.center[0] + offsetX;
  const dy2 = -viewState.center[1];
  return _ol_transform_.compose(this.transform_, dx1, dy1, sx, sy, angle, dx2, dy2);
};


/**
 * @abstract
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {CanvasRenderingContext2D} context Context.
 */
CanvasLayerRenderer.prototype.composeFrame = function(frameState, layerState, context) {};

/**
 * @abstract
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @return {boolean} whether composeFrame should be called.
 */
CanvasLayerRenderer.prototype.prepareFrame = function(frameState, layerState) {};
export default CanvasLayerRenderer;
