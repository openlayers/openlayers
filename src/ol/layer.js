goog.provide('ol.Layer');

goog.require('ol.Object');
goog.require('ol.Store');


/**
 * @enum {string}
 * @private
 */
ol.LayerRendererOptionsProperty_ = {
  OPACITY: 'opacity',
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

  this.setVisible(true);
  this.setOpacity(1);

  if (goog.isDef(opt_values)) {
    this.setValues(opt_values);
  }

};
goog.inherits(ol.Layer, ol.Object);


/**
 * @return {number} Opacity.
 */
ol.Layer.prototype.getOpacity = function() {
  return /** @type {number} */ (
      this.get(ol.LayerRendererOptionsProperty_.OPACITY));
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
      this.get(ol.LayerRendererOptionsProperty_.VISIBLE));
};


/**
 * @param {number} opacity Opacity.
 */
ol.Layer.prototype.setOpacity = function(opacity) {
  this.set(ol.LayerRendererOptionsProperty_.OPACITY, opacity);
};


/**
 * @param {boolean} visible Visible.
 */
ol.Layer.prototype.setVisible = function(visible) {
  this.set(ol.LayerRendererOptionsProperty_.VISIBLE, visible);
};
