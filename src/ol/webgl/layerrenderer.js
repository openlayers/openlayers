goog.provide('ol.webgl.LayerRenderer');

goog.require('goog.vec.Mat4');
goog.require('ol.Layer');
goog.require('ol.LayerRenderer');



/**
 * @constructor
 * @extends {ol.LayerRenderer}
 * @param {ol.MapRenderer} mapRenderer Map renderer.
 * @param {ol.Layer} layer Layer.
 */
ol.webgl.LayerRenderer = function(mapRenderer, layer) {
  goog.base(this, mapRenderer, layer);
};
goog.inherits(ol.webgl.LayerRenderer, ol.LayerRenderer);


/**
 * @protected
 */
ol.webgl.LayerRenderer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @return {WebGLTexture} Texture.
 */
ol.webgl.LayerRenderer.prototype.getTexture = goog.abstractMethod;


/**
 * @override
 * @return {ol.MapRenderer} MapRenderer.
 */
ol.webgl.LayerRenderer.prototype.getMapRenderer = function() {
  return /** @type {ol.webgl.MapRenderer} */ goog.base(this, 'getMapRenderer');
};


/**
 * @return {goog.vec.Mat4.AnyType} Matrix.
 */
ol.webgl.LayerRenderer.prototype.getMatrix = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.webgl.LayerRenderer.prototype.handleLayerBrightnessChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.LayerRenderer.prototype.handleLayerContrastChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.LayerRenderer.prototype.handleLayerHueChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.LayerRenderer.prototype.handleLayerLoad = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.LayerRenderer.prototype.handleLayerOpacityChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.LayerRenderer.prototype.handleLayerSaturationChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.LayerRenderer.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};


/**
 */
ol.webgl.LayerRenderer.prototype.handleWebGLContextLost = goog.nullFunction;


/**
 */
ol.webgl.LayerRenderer.prototype.render = goog.abstractMethod;
