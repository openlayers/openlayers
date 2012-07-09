goog.provide('ol.LayerRendererOptions');

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
 */
ol.LayerRendererOptions = function() {

  goog.base(this);

  this.setVisible(true);
  this.setOpacity(1);

};
goog.inherits(ol.LayerRendererOptions, ol.Object);


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
