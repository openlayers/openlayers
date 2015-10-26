goog.provide('ol.renderer.canvas.Layer');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.Layer');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.Immediate');
goog.require('ol.renderer.Layer');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.layer.Layer} layer Layer.
 */
ol.renderer.canvas.Layer = function(layer) {

  goog.base(this, layer);

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

};
goog.inherits(ol.renderer.canvas.Layer, ol.renderer.Layer);


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 * @param {CanvasRenderingContext2D} context Context.
 */
ol.renderer.canvas.Layer.prototype.composeFrame =
    function(frameState, layerState, context) {

  this.dispatchPreComposeEvent(context, frameState);

  var image = this.getImage();
  if (image) {

    // clipped rendering if layer extent is set
    var extent = layerState.extent;
    var clipped = extent !== undefined;
    if (clipped) {
      goog.asserts.assert(extent !== undefined,
          'layerState extent is defined');
      var pixelRatio = frameState.pixelRatio;
      var topLeft = ol.extent.getTopLeft(extent);
      var topRight = ol.extent.getTopRight(extent);
      var bottomRight = ol.extent.getBottomRight(extent);
      var bottomLeft = ol.extent.getBottomLeft(extent);

      ol.vec.Mat4.multVec2(frameState.coordinateToPixelMatrix,
          topLeft, topLeft);
      ol.vec.Mat4.multVec2(frameState.coordinateToPixelMatrix,
          topRight, topRight);
      ol.vec.Mat4.multVec2(frameState.coordinateToPixelMatrix,
          bottomRight, bottomRight);
      ol.vec.Mat4.multVec2(frameState.coordinateToPixelMatrix,
          bottomLeft, bottomLeft);

      context.save();
      context.beginPath();
      context.moveTo(topLeft[0] * pixelRatio, topLeft[1] * pixelRatio);
      context.lineTo(topRight[0] * pixelRatio, topRight[1] * pixelRatio);
      context.lineTo(bottomRight[0] * pixelRatio, bottomRight[1] * pixelRatio);
      context.lineTo(bottomLeft[0] * pixelRatio, bottomLeft[1] * pixelRatio);
      context.clip();
    }

    var imageTransform = this.getImageTransform();
    // for performance reasons, context.save / context.restore is not used
    // to save and restore the transformation matrix and the opacity.
    // see http://jsperf.com/context-save-restore-versus-variable
    var alpha = context.globalAlpha;
    context.globalAlpha = layerState.opacity;

    // for performance reasons, context.setTransform is only used
    // when the view is rotated. see http://jsperf.com/canvas-transform
    if (frameState.viewState.rotation === 0) {
      var dx = goog.vec.Mat4.getElement(imageTransform, 0, 3);
      var dy = goog.vec.Mat4.getElement(imageTransform, 1, 3);
      var dw = image.width * goog.vec.Mat4.getElement(imageTransform, 0, 0);
      var dh = image.height * goog.vec.Mat4.getElement(imageTransform, 1, 1);
      context.drawImage(image, 0, 0, +image.width, +image.height,
          Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    } else {
      context.setTransform(
          goog.vec.Mat4.getElement(imageTransform, 0, 0),
          goog.vec.Mat4.getElement(imageTransform, 1, 0),
          goog.vec.Mat4.getElement(imageTransform, 0, 1),
          goog.vec.Mat4.getElement(imageTransform, 1, 1),
          goog.vec.Mat4.getElement(imageTransform, 0, 3),
          goog.vec.Mat4.getElement(imageTransform, 1, 3));
      context.drawImage(image, 0, 0);
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
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
 * @param {goog.vec.Mat4.Number=} opt_transform Transform.
 * @private
 */
ol.renderer.canvas.Layer.prototype.dispatchComposeEvent_ =
    function(type, context, frameState, opt_transform) {
  var layer = this.getLayer();
  if (layer.hasListener(type)) {
    var transform = opt_transform !== undefined ?
        opt_transform : this.getTransform(frameState, 0);
    var render = new ol.render.canvas.Immediate(
        context, frameState.pixelRatio, frameState.extent, transform,
        frameState.viewState.rotation);
    var composeEvent = new ol.render.Event(type, layer, render, frameState,
        context, null);
    layer.dispatchEvent(composeEvent);
    render.flush();
  }
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {goog.vec.Mat4.Number=} opt_transform Transform.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.dispatchPostComposeEvent =
    function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.EventType.POSTCOMPOSE, context,
      frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {goog.vec.Mat4.Number=} opt_transform Transform.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.dispatchPreComposeEvent =
    function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.EventType.PRECOMPOSE, context,
      frameState, opt_transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {goog.vec.Mat4.Number=} opt_transform Transform.
 * @protected
 */
ol.renderer.canvas.Layer.prototype.dispatchRenderEvent =
    function(context, frameState, opt_transform) {
  this.dispatchComposeEvent_(ol.render.EventType.RENDER, context,
      frameState, opt_transform);
};


/**
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Canvas.
 */
ol.renderer.canvas.Layer.prototype.getImage = goog.abstractMethod;


/**
 * @return {!goog.vec.Mat4.Number} Image transform.
 */
ol.renderer.canvas.Layer.prototype.getImageTransform = goog.abstractMethod;


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {number} offsetX Offset on the x-axis in view coordinates.
 * @protected
 * @return {!goog.vec.Mat4.Number} Transform.
 */
ol.renderer.canvas.Layer.prototype.getTransform =
    function(frameState, offsetX) {
  var viewState = frameState.viewState;
  var pixelRatio = frameState.pixelRatio;
  return ol.vec.Mat4.makeTransform2D(this.transform_,
      pixelRatio * frameState.size[0] / 2,
      pixelRatio * frameState.size[1] / 2,
      pixelRatio / viewState.resolution,
      -pixelRatio / viewState.resolution,
      -viewState.rotation,
      -viewState.center[0] + offsetX,
      -viewState.center[1]);
};


/**
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 * @return {boolean} whether composeFrame should be called.
 */
ol.renderer.canvas.Layer.prototype.prepareFrame = goog.abstractMethod;


/**
 * @param {ol.Pixel} pixelOnMap Pixel.
 * @param {goog.vec.Mat4.Number} imageTransformInv The transformation matrix
 *        to convert from a map pixel to a canvas pixel.
 * @return {ol.Pixel}
 * @protected
 */
ol.renderer.canvas.Layer.prototype.getPixelOnCanvas =
    function(pixelOnMap, imageTransformInv) {
  var pixelOnCanvas = [0, 0];
  ol.vec.Mat4.multVec2(imageTransformInv, pixelOnMap, pixelOnCanvas);
  return pixelOnCanvas;
};


/**
 * @param {ol.Size} size Size.
 * @return {boolean} True when the canvas with the current size does not exceed
 *     the maximum dimensions.
 */
ol.renderer.canvas.Layer.testCanvasSize = (function() {

  /**
   * @type {CanvasRenderingContext2D}
   */
  var context = null;

  /**
   * @type {ImageData}
   */
  var imageData = null;

  return function(size) {
    if (!context) {
      context = ol.dom.createCanvasContext2D(1, 1);
      imageData = context.createImageData(1, 1);
      var data = imageData.data;
      data[0] = 42;
      data[1] = 84;
      data[2] = 126;
      data[3] = 255;
    }
    var canvas = context.canvas;
    var good = size[0] <= canvas.width && size[1] <= canvas.height;
    if (!good) {
      canvas.width = size[0];
      canvas.height = size[1];
      var x = size[0] - 1;
      var y = size[1] - 1;
      context.putImageData(imageData, x, y);
      var result = context.getImageData(x, y, 1, 1);
      good = goog.array.equals(imageData.data, result.data);
    }
    return good;
  };
})();
