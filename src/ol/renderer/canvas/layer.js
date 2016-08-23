goog.provide('ol.renderer.canvas.Layer');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
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
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {CanvasRenderingContext2D} context Context.
 */
ol.renderer.canvas.Layer.prototype.composeFrame = function(frameState, layerState, context) {

  this.dispatchPreComposeEvent(context, frameState);

  var image = this.getImage();
  if (image) {

    // clipped rendering if layer extent is set
    var extent = layerState.extent;
    var clipped = extent !== undefined;
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

  this.dispatchPostComposeEvent(context, frameState);

};


/**
 * @param {ol.render.EventType} type Event type.
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
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.dispatchPostComposeEvent = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.EventType.POSTCOMPOSE, context,
      frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.dispatchPreComposeEvent = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.EventType.PRECOMPOSE, context,
      frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.Transform=} opt_transform Transform.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.dispatchRenderEvent = function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.EventType.RENDER, context,
      frameState, opt_transform);
};


/**
 * @abstract
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Canvas.
 */
ol.renderer.canvas.Layer.prototype.getImage = function() {};


/**
 * @abstract
 * @return {!ol.Transform} Image transform.
 */
ol.renderer.canvas.Layer.prototype.getImageTransform = function() {};


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
 * @return {boolean} whether composeFrame should be called.
 */
ol.renderer.canvas.Layer.prototype.prepareFrame = function(frameState, layerState) {};


/**
 * @param {ol.Pixel} pixelOnMap Pixel.
 * @param {ol.Transform} imageTransformInv The transformation matrix
 *        to convert from a map pixel to a canvas pixel.
 * @return {ol.Pixel} The pixel.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.getPixelOnCanvas = function(pixelOnMap, imageTransformInv) {
  return ol.transform.apply(imageTransformInv, pixelOnMap.slice());
};
