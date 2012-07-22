goog.provide('ol.Layer');
goog.provide('ol.LayerProperty');

goog.require('ol.Object');
goog.require('ol.Store');


/**
 * @enum {string}
 */
ol.LayerProperty = {
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
 * @param {number} hue Hue.
 */
ol.Layer.prototype.setHue = function(hue) {
  this.set(ol.LayerProperty.HUE, hue);
};


/**
 * @param {number} opacity Opacity.
 */
ol.Layer.prototype.setOpacity = function(opacity) {
  this.set(ol.LayerProperty.OPACITY, opacity);
};


/**
 * @param {number} saturation Saturation.
 */
ol.Layer.prototype.setSaturation = function(saturation) {
  this.set(ol.LayerProperty.SATURATION, saturation);
};


/**
 * @param {boolean} visible Visible.
 */
ol.Layer.prototype.setVisible = function(visible) {
  this.set(ol.LayerProperty.VISIBLE, visible);
};
