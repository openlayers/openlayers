goog.provide('ol.renderer.canvas.Layer');

goog.require('goog.vec.Mat4');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 */
ol.renderer.canvas.Layer = function(mapRenderer, layer) {
  goog.base(this, mapRenderer, layer);
};
goog.inherits(ol.renderer.canvas.Layer, ol.renderer.Layer);


/**
 * @param {ol.FrameState} frameState Frame state.
 * @param {ol.layer.LayerState} layerState Layer state.
 * @param {CanvasRenderingContext2D} context Context.
 */
ol.renderer.canvas.Layer.prototype.composeFrame =
    function(frameState, layerState, context) {

  var image = this.getImage();
  if (!goog.isNull(image)) {
    var transform = this.getTransform();
    context.globalAlpha = layerState.opacity;

    // for performance reasons, context.setTransform is only used
    // when the view is rotated. see http://jsperf.com/canvas-transform
    if (frameState.view2DState.rotation === 0) {
      var dx = goog.vec.Mat4.getElement(transform, 0, 3);
      var dy = goog.vec.Mat4.getElement(transform, 1, 3);
      var dw = image.width * goog.vec.Mat4.getElement(transform, 0, 0);
      var dh = image.height * goog.vec.Mat4.getElement(transform, 1, 1);
      context.drawImage(image, 0, 0, +image.width, +image.height,
          Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    } else {
      context.setTransform(
          goog.vec.Mat4.getElement(transform, 0, 0),
          goog.vec.Mat4.getElement(transform, 1, 0),
          goog.vec.Mat4.getElement(transform, 0, 1),
          goog.vec.Mat4.getElement(transform, 1, 1),
          goog.vec.Mat4.getElement(transform, 0, 3),
          goog.vec.Mat4.getElement(transform, 1, 3));
      context.drawImage(image, 0, 0);
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

};


/**
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Canvas.
 */
ol.renderer.canvas.Layer.prototype.getImage = goog.abstractMethod;


/**
 * @return {!goog.vec.Mat4.Number} Transform.
 */
ol.renderer.canvas.Layer.prototype.getTransform = goog.abstractMethod;
