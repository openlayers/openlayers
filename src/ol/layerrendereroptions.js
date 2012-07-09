goog.provide('ol.LayerRendererOptions');

goog.require('ol.Layer');
goog.require('ol.Object');


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
 * @param {ol.Layer} layer Layer.
 */
ol.LayerRendererOptions = function(layer) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Layer}
   */
  this.layer_ = layer;

  this.setVisible(true);
  this.setOpacity(1);

};
goog.inherits(ol.LayerRendererOptions, ol.Object);


/**
 * @return {ol.Layer} Layer.
 */
ol.LayerRendererOptions.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * @return {number} Opacity.
 */
ol.LayerRendererOptions.prototype.getOpacity = function() {
  return /** @type {number} */ (
      this.get(ol.LayerRendererOptionsProperty_.OPACITY));
};


/**
 * @return {boolean} Visible.
 */
ol.LayerRendererOptions.prototype.getVisible = function() {
  return /** @type {boolean} */ (
      this.get(ol.LayerRendererOptionsProperty_.VISIBLE));
};


/**
 * @param {number} opacity Opacity.
 */
ol.LayerRendererOptions.prototype.setOpacity = function(opacity) {
  this.set(ol.LayerRendererOptionsProperty_.OPACITY, opacity);
};


/**
 * @param {boolean} visible Visible.
 */
ol.LayerRendererOptions.prototype.setVisible = function(visible) {
  this.set(ol.LayerRendererOptionsProperty_.VISIBLE, visible);
};
