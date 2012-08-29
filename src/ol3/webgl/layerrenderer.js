goog.provide('ol3.webgl.LayerRenderer');

goog.require('goog.vec.Mat4');
goog.require('ol3.Layer');
goog.require('ol3.LayerRenderer');



/**
 * @constructor
 * @extends {ol3.LayerRenderer}
 * @param {ol3.MapRenderer} mapRenderer Map renderer.
 * @param {ol3.Layer} layer Layer.
 */
ol3.webgl.LayerRenderer = function(mapRenderer, layer) {
  goog.base(this, mapRenderer, layer);
};
goog.inherits(ol3.webgl.LayerRenderer, ol3.LayerRenderer);


/**
 * @protected
 */
ol3.webgl.LayerRenderer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @override
 * @return {ol3.MapRenderer} MapRenderer.
 */
ol3.webgl.LayerRenderer.prototype.getMapRenderer = function() {
  return /** @type {ol3.webgl.MapRenderer} */ goog.base(this, 'getMapRenderer');
};


/**
 * @return {goog.vec.Mat4.AnyType} Matrix.
 */
ol3.webgl.LayerRenderer.prototype.getMatrix = goog.abstractMethod;


/**
 * @return {WebGLTexture} Texture.
 */
ol3.webgl.LayerRenderer.prototype.getTexture = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol3.webgl.LayerRenderer.prototype.handleLayerBrightnessChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.webgl.LayerRenderer.prototype.handleLayerContrastChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.webgl.LayerRenderer.prototype.handleLayerHueChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.webgl.LayerRenderer.prototype.handleLayerLoad = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.webgl.LayerRenderer.prototype.handleLayerOpacityChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.webgl.LayerRenderer.prototype.handleLayerSaturationChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol3.webgl.LayerRenderer.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};


/**
 */
ol3.webgl.LayerRenderer.prototype.handleWebGLContextLost = goog.nullFunction;


/**
 */
ol3.webgl.LayerRenderer.prototype.render = goog.abstractMethod;
