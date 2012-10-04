goog.provide('ol.renderer.webgl.Layer');

goog.require('goog.vec.Mat4');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 */
ol.renderer.webgl.Layer = function(mapRenderer, layer) {
  goog.base(this, mapRenderer, layer);
};
goog.inherits(ol.renderer.webgl.Layer, ol.renderer.Layer);


/**
 * @protected
 */
ol.renderer.webgl.Layer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @inheritDoc
 * @return {ol.renderer.Map} MapRenderer.
 */
ol.renderer.webgl.Layer.prototype.getMapRenderer = function() {
  return /** @type {ol.renderer.webgl.Map} */ goog.base(
      this, 'getMapRenderer');
};


/**
 * @return {goog.vec.Mat4.AnyType} Matrix.
 */
ol.renderer.webgl.Layer.prototype.getMatrix = goog.abstractMethod;


/**
 * @return {WebGLTexture} Texture.
 */
ol.renderer.webgl.Layer.prototype.getTexture = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerBrightnessChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerContrastChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerHueChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerLoad = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerOpacityChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerSaturationChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};


/**
 * Handle webglcontextlost.
 */
ol.renderer.webgl.Layer.prototype.handleWebGLContextLost = goog.nullFunction;


/**
 * Render.
 * @return {boolean} Request render frame.
 */
ol.renderer.webgl.Layer.prototype.render = goog.abstractMethod;
