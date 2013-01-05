goog.provide('ol.renderer.webgl.Layer');

goog.require('goog.vec.Mat4');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 */
ol.renderer.webgl.Layer = function(mapRenderer, layer) {

  goog.base(this, mapRenderer, layer);

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.brightnessMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.contrastMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.hueMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.saturationMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.colorMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {boolean}
   */
  this.colorMatrixDirty_ = true;

  this.handleLayerBrightnessChange();
  this.handleLayerContrastChange();
  this.handleLayerHueChange();
  this.handleLayerSaturationChange();

};
goog.inherits(ol.renderer.webgl.Layer, ol.renderer.Layer);


/**
 * @protected
 */
ol.renderer.webgl.Layer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @return {!goog.vec.Mat4.Float32} Color matrix.
 */
ol.renderer.webgl.Layer.prototype.getColorMatrix = function() {
  if (this.colorMatrixDirty_) {
    this.updateColorMatrix_();
  }
  return this.colorMatrix_;
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
 * @return {!goog.vec.Mat4.Number} Matrix.
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
  var value = this.getLayer().getBrightness();
  ol.vec.Mat4.makeBrightness(this.brightnessMatrix_, value);
  this.colorMatrixDirty_ = true;
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerContrastChange = function() {
  var value = this.getLayer().getContrast();
  ol.vec.Mat4.makeContrast(this.contrastMatrix_, value);
  this.colorMatrixDirty_ = true;
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.Layer.prototype.handleLayerHueChange = function() {
  var value = this.getLayer().getHue();
  ol.vec.Mat4.makeHue(this.hueMatrix_, value);
  this.colorMatrixDirty_ = true;
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
  var saturation = this.getLayer().getSaturation();
  ol.vec.Mat4.makeSaturation(this.saturationMatrix_, saturation);
  this.colorMatrixDirty_ = true;
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
 * @param {number} time Time.
 * @return {boolean} Request render frame.
 */
ol.renderer.webgl.Layer.prototype.renderFrame = goog.abstractMethod;


/**
 * @private
 */
ol.renderer.webgl.Layer.prototype.updateColorMatrix_ = function() {
  var colorMatrix = this.colorMatrix_;
  goog.vec.Mat4.makeIdentity(colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.contrastMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.brightnessMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.saturationMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.hueMatrix_, colorMatrix);
  this.colorMatrixDirty_ = false;
};
