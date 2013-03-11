goog.provide('ol.renderer.canvas.Layer');

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
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Canvas.
 */
ol.renderer.canvas.Layer.prototype.getImage = goog.abstractMethod;


/**
 * @return {!goog.vec.Mat4.Number} Transform.
 */
ol.renderer.canvas.Layer.prototype.getTransform = goog.abstractMethod;
