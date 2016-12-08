goog.provide('ol.renderer.canvas.Layer');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.functions');
goog.require('ol.render.Event');
goog.require('ol.render.canvas');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.renderer.Layer');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.layer.Layer} layer Layer.
 */
ol.renderer.canvas.Layer = function(layer) {

  ol.renderer.Layer.call(this, layer);

  /**
   * @protected
   * @type {number}
   */
  this.renderedResolution;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.transform_ = ol.transform.create();

};
ol.inherits(ol.renderer.canvas.Layer, ol.renderer.Layer);


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Extent} extent Clip extent.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.clip = function(context, frameState, extent) {
  var pixelRatio = frameState.pixelRatio;
  var width = frameState.size[0] * pixelRatio;
  var height = frameState.size[1] * pixelRatio;
  var rotation = frameState.viewState.rotation;
  var topLeft = ol.extent.getTopLeft(/** @type {ol.Extent} */ (extent));
  var topRight = ol.extent.getTopRight(/** @type {ol.Extent} */ (extent));
  var bottomRight = ol.extent.getBottomRight(/** @type {ol.Extent} */ (extent));
  var bottomLeft = ol.extent.getBottomLeft(/** @type {ol.Extent} */ (extent));

  ol.transform.apply(frameState.coordinateToPixelTransform, topLeft);
  ol.transform.apply(frameState.coordinateToPixelTransform, topRight);
  ol.transform.apply(frameState.coordinateToPixelTransform, bottomRight);
  ol.transform.apply(frameState.coordinateToPixelTransform, bottomLeft);

  context.save();
  ol.render.canvas.rotateAtOffset(context, -rotation, width / 2, height / 2);
  context.beginPath();
  context.moveTo(topLeft[0] * pixelRatio, topLeft[1] * pixelRatio);
  context.lineTo(topRight[0] * pixelRatio, topRight[1] * pixelRatio);
  context.lineTo(bottomRight[0] * pixelRatio, bottomRight[1] * pixelRatio);
  context.lineTo(bottomLeft[0] * pixelRatio, bottomLeft[1] * pixelRatio);
  context.clip();
  ol.render.canvas.rotateAtOffset(context, rotation, width / 2, height / 2);
};


/**
 * @param {ol.render.Event.Type} type Event type.
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @private
 */
ol.renderer.canvas.Layer.prototype.dispatchComposeEvent_ = function(type, context, frameState, opt_transform) {
  var layer = this.getLayer();
  if (layer.hasListener(type)) {
    var width = frameState.size[0] * frameState.pixelRatio;
    var height = frameState.size[1] * frameState.pixelRatio;
    var rotation = frameState.viewState.rotation;
    ol.render.canvas.rotateAtOffset(context, -rotation, width / 2, height / 2);
    var transform = opt_transform !== undefined ?
        opt_transform : this.getTransform(frameState, 0);
    var render = new ol.render.canvas.Immediate(
        context, frameState.pixelRatio, frameState.extent, transform,
        frameState.viewState.rotation);
    var composeEvent = new ol.render.Event(type, render, frameState,
        context, null);
    layer.dispatchEvent(composeEvent);
    ol.render.canvas.rotateAtOffset(context, rotation, width / 2, height / 2);
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
ol.renderer.canvas.Layer.prototype.forEachLayerAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  var hasFeature = this.forEachFeatureAtCoordinate(
      coordinate, frameState, 0, ol.functions.TRUE, this);

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
ol.renderer.canvas.Layer.prototype.postCompose = function(context, frameState, layerState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.Event.Type.POSTCOMPOSE, context,
      frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.preCompose = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.Event.Type.PRECOMPOSE, context,
      frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.dispatchRenderEvent = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.Event.Type.RENDER, context,
      frameState, opt_transform);
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {number} offsetX Offset on the x-axis in view coordinates.
 * @protected
 * @return {!ol.Transform} Transform.
 */
ol.renderer.canvas.Layer.prototype.getTransform = function(frameState, offsetX) {
  var viewState = frameState.viewState;
  var pixelRatio = frameState.pixelRatio;
  var dx1 = pixelRatio * frameState.size[0] / 2;
  var dy1 = pixelRatio * frameState.size[1] / 2;
  var sx = pixelRatio / viewState.resolution;
  var sy = -sx;
  var angle = -viewState.rotation;
  var dx2 = -viewState.center[0] + offsetX;
  var dy2 = -viewState.center[1];
  return ol.transform.compose(this.transform_, dx1, dy1, sx, sy, angle, dx2, dy2);
};


/**
 * @abstract
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {CanvasRenderingContext2D} context Context.
 */
ol.renderer.canvas.Layer.prototype.composeFrame = function(frameState, layerState, context) {};

/**
 * @abstract
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @return {boolean} whether composeFrame should be called.
 */
ol.renderer.canvas.Layer.prototype.prepareFrame = function(frameState, layerState) {};
