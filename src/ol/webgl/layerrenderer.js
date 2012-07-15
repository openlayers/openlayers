goog.provide('ol.webgl.LayerRenderer');

goog.require('ol.LayerRenderer');



/**
 * @constructor
 * @extends {ol.LayerRenderer}
 * @param {ol.webgl.Map} map Map.
 * @param {ol.Layer} layer Layer.
 */
ol.webgl.LayerRenderer = function(map, layer) {
  goog.base(this, map, layer);
};
goog.inherits(ol.webgl.LayerRenderer, ol.LayerRenderer);


/**
 * @return {WebGLTexture} Texture.
 */
ol.webgl.LayerRenderer.prototype.getTexture = goog.abstractMethod;


/**
 * @return {WebGLRenderingContext} GL.
 */
ol.webgl.LayerRenderer.prototype.getGL = function() {
  var map = /** @type {ol.webgl.Map} */ this.getMap();
  return map.getGL();
};


/**
 */
ol.webgl.LayerRenderer.prototype.redraw = goog.abstractMethod;
