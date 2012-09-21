goog.provide('ol3.renderer.webgl.Layer');

goog.require('goog.vec.Mat4');
goog.require('ol3.Layer');
goog.require('ol3.renderer.Layer');



/**
 * @constructor
 * @extends {ol3.renderer.Layer}
 * @param {ol3.renderer.Map} mapRenderer Map renderer.
 * @param {ol3.Layer} layer Layer.
 */
ol3.renderer.webgl.Layer = function(mapRenderer, layer) {
  goog.base(this, mapRenderer, layer);
};
goog.inherits(ol3.renderer.webgl.Layer, ol3.renderer.Layer);


/**
 * @protected
 */
ol3.renderer.webgl.Layer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @inheritDoc
 * @return {ol3.renderer.Map} MapRenderer.
 */
ol3.renderer.webgl.Layer.prototype.getMapRenderer = function() {
  return /** @type {ol3.renderer.webgl.Map} */ goog.base(
      this, 'getMapRenderer');
};


/**
 * @return {goog.vec.Mat4.AnyType} Matrix.
 */
ol3.renderer.webgl.Layer.prototype.getMatrix = goog.abstractMethod;


/**
 * @return {WebGLTexture} Texture.
 */
ol3.renderer.webgl.Layer.prototype.getTexture = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol3.renderer.webgl.Layer.prototype.handleLayerBrightnessChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.renderer.webgl.Layer.prototype.handleLayerContrastChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.renderer.webgl.Layer.prototype.handleLayerHueChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.renderer.webgl.Layer.prototype.handleLayerLoad = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.renderer.webgl.Layer.prototype.handleLayerOpacityChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.renderer.webgl.Layer.prototype.handleLayerSaturationChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.renderer.webgl.Layer.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};


/**
 * Handle webglcontextlost.
 */
ol3.renderer.webgl.Layer.prototype.handleWebGLContextLost = goog.nullFunction;


/**
 * Render.
 */
ol3.renderer.webgl.Layer.prototype.render = goog.abstractMethod;
