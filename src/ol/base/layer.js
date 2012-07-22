goog.provide('ol.Layer');
goog.provide('ol.LayerProperty');

goog.require('goog.math');
goog.require('ol.Object');
goog.require('ol.Store');


/**
 * @enum {string}
 */
ol.LayerProperty = {
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  HUE: 'hue',
  OPACITY: 'opacity',
  SATURATION: 'saturation',
  VISIBLE: 'visible'
};



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.Store} store Store.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.Layer = function(store, opt_values) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Store}
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
goog.inherits(ol.Layer, ol.Object);


/**
 * @return {number} Brightness.
 */
ol.Layer.prototype.getBrightness = function() {
  return /** @type {number} */ this.get(ol.LayerProperty.BRIGHTNESS);
};


/**
 * @return {number} Contrast.
 */
ol.Layer.prototype.getContrast = function() {
  return /** @type {number} */ this.get(ol.LayerProperty.CONTRAST);
};


/**
 * @return {number} Hue.
 */
ol.Layer.prototype.getHue = function() {
  return /** @type {number} */ this.get(ol.LayerProperty.HUE);
};


/**
 * @return {number} Opacity.
 */
ol.Layer.prototype.getOpacity = function() {
  return /** @type {number} */ (
      this.get(ol.LayerProperty.OPACITY));
};


/**
 * @return {number} Saturation.
 */
ol.Layer.prototype.getSaturation = function() {
  return /** @type {number} */ this.get(ol.LayerProperty.SATURATION);
};


/**
 * @return {ol.Store} Store.
 */
ol.Layer.prototype.getStore = function() {
  return this.store_;
};


/**
 * @return {boolean} Visible.
 */
ol.Layer.prototype.getVisible = function() {
  return /** @type {boolean} */ (
      this.get(ol.LayerProperty.VISIBLE));
};


/**
 * @param {number} brightness Brightness.
 */
ol.Layer.prototype.setBrightness = function(brightness) {
  brightness = goog.math.clamp(brightness, -1, 1);
  if (brightness != this.getBrightness()) {
    this.set(ol.LayerProperty.BRIGHTNESS, brightness);
  }
};


/**
 * @param {number} contrast Contrast.
 */
ol.Layer.prototype.setContrast = function(contrast) {
  contrast = goog.math.clamp(contrast, -1, 1);
  if (contrast != this.getContrast()) {
    this.set(ol.LayerProperty.CONTRAST, contrast);
  }
};


/**
 * @param {number} hue Hue.
 */
ol.Layer.prototype.setHue = function(hue) {
  if (hue != this.getHue()) {
    this.set(ol.LayerProperty.HUE, hue);
  }
};


/**
 * @param {number} opacity Opacity.
 */
ol.Layer.prototype.setOpacity = function(opacity) {
  opacity = goog.math.clamp(opacity, 0, 1);
  if (opacity != this.getOpacity()) {
    this.set(ol.LayerProperty.OPACITY, opacity);
  }
};


/**
 * @param {number} saturation Saturation.
 */
ol.Layer.prototype.setSaturation = function(saturation) {
  saturation = goog.math.clamp(saturation, -1, 1);
  if (saturation != this.getSaturation()) {
    this.set(ol.LayerProperty.SATURATION, saturation);
  }
};


/**
 * @param {boolean} visible Visible.
 */
ol.Layer.prototype.setVisible = function(visible) {
  visible = !!visible;
  if (visible != this.getVisible()) {
    this.set(ol.LayerProperty.VISIBLE, visible);
  }
};
