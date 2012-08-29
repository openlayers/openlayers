goog.provide('ol3.Layer');
goog.provide('ol3.LayerProperty');

goog.require('goog.math');
goog.require('ol3.Object');
goog.require('ol3.Store');


/**
 * @enum {string}
 */
ol3.LayerProperty = {
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  HUE: 'hue',
  OPACITY: 'opacity',
  SATURATION: 'saturation',
  VISIBLE: 'visible'
};



/**
 * @constructor
 * @extends {ol3.Object}
 * @param {ol3.Store} store Store.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.Layer = function(store, opt_values) {

  goog.base(this);

  /**
   * @private
   * @type {ol3.Store}
   */
  this.store_ = store;

  this.setBrightness(0);
  this.setContrast(0);
  this.setHue(0);
  this.setOpacity(1);
  this.setSaturation(0);
  this.setVisible(true);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol3.Layer, ol3.Object);


/**
 * @return {number} Brightness.
 */
ol3.Layer.prototype.getBrightness = function() {
  return /** @type {number} */ this.get(ol3.LayerProperty.BRIGHTNESS);
};
goog.exportProperty(
    ol3.Layer.prototype,
    'getBrightness',
    ol3.Layer.prototype.getBrightness);


/**
 * @return {number} Contrast.
 */
ol3.Layer.prototype.getContrast = function() {
  return /** @type {number} */ this.get(ol3.LayerProperty.CONTRAST);
};
goog.exportProperty(
    ol3.Layer.prototype,
    'getContrast',
    ol3.Layer.prototype.getContrast);


/**
 * @return {number} Hue.
 */
ol3.Layer.prototype.getHue = function() {
  return /** @type {number} */ this.get(ol3.LayerProperty.HUE);
};
goog.exportProperty(
    ol3.Layer.prototype,
    'getHue',
    ol3.Layer.prototype.getHue);


/**
 * @return {number} Opacity.
 */
ol3.Layer.prototype.getOpacity = function() {
  return /** @type {number} */ this.get(ol3.LayerProperty.OPACITY);
};
goog.exportProperty(
    ol3.Layer.prototype,
    'getOpacity',
    ol3.Layer.prototype.getOpacity);


/**
 * @return {number} Saturation.
 */
ol3.Layer.prototype.getSaturation = function() {
  return /** @type {number} */ this.get(ol3.LayerProperty.SATURATION);
};
goog.exportProperty(
    ol3.Layer.prototype,
    'getSaturation',
    ol3.Layer.prototype.getSaturation);


/**
 * @return {ol3.Store} Store.
 */
ol3.Layer.prototype.getStore = function() {
  return this.store_;
};


/**
 * @return {boolean} Visible.
 */
ol3.Layer.prototype.getVisible = function() {
  return /** @type {boolean} */ this.get(ol3.LayerProperty.VISIBLE);
};
goog.exportProperty(
    ol3.Layer.prototype,
    'getVisible',
    ol3.Layer.prototype.getVisible);


/**
 * @return {boolean} Is ready.
 */
ol3.Layer.prototype.isReady = function() {
  return this.getStore().isReady();
};


/**
 * @param {number} brightness Brightness.
 */
ol3.Layer.prototype.setBrightness = function(brightness) {
  brightness = goog.math.clamp(brightness, -1, 1);
  if (brightness != this.getBrightness()) {
    this.set(ol3.LayerProperty.BRIGHTNESS, brightness);
  }
};
goog.exportProperty(
    ol3.Layer.prototype,
    'setBrightness',
    ol3.Layer.prototype.setBrightness);


/**
 * @param {number} contrast Contrast.
 */
ol3.Layer.prototype.setContrast = function(contrast) {
  contrast = goog.math.clamp(contrast, -1, 1);
  if (contrast != this.getContrast()) {
    this.set(ol3.LayerProperty.CONTRAST, contrast);
  }
};
goog.exportProperty(
    ol3.Layer.prototype,
    'setContrast',
    ol3.Layer.prototype.setContrast);


/**
 * @param {number} hue Hue.
 */
ol3.Layer.prototype.setHue = function(hue) {
  if (hue != this.getHue()) {
    this.set(ol3.LayerProperty.HUE, hue);
  }
};
goog.exportProperty(
    ol3.Layer.prototype,
    'setHue',
    ol3.Layer.prototype.setHue);


/**
 * @param {number} opacity Opacity.
 */
ol3.Layer.prototype.setOpacity = function(opacity) {
  opacity = goog.math.clamp(opacity, 0, 1);
  if (opacity != this.getOpacity()) {
    this.set(ol3.LayerProperty.OPACITY, opacity);
  }
};
goog.exportProperty(
    ol3.Layer.prototype,
    'setOpacity',
    ol3.Layer.prototype.setOpacity);


/**
 * @param {number} saturation Saturation.
 */
ol3.Layer.prototype.setSaturation = function(saturation) {
  saturation = goog.math.clamp(saturation, -1, 1);
  if (saturation != this.getSaturation()) {
    this.set(ol3.LayerProperty.SATURATION, saturation);
  }
};
goog.exportProperty(
    ol3.Layer.prototype,
    'setSaturation',
    ol3.Layer.prototype.setSaturation);


/**
 * @param {boolean} visible Visible.
 */
ol3.Layer.prototype.setVisible = function(visible) {
  visible = !!visible;
  if (visible != this.getVisible()) {
    this.set(ol3.LayerProperty.VISIBLE, visible);
  }
};
goog.exportProperty(
    ol3.Layer.prototype,
    'setVisible',
    ol3.Layer.prototype.setVisible);
