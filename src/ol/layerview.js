goog.provide('ol.LayerView');

goog.require('ol.MVCObject');


/**
 * @enum {string}
 * @private
 */
ol.LayerViewProperty_ = {
  OPACITY: 'opacity',
  VISIBLE: 'visible'
};



/**
 * @constructor
 * @extends {ol.MVCObject}
 */
ol.LayerView = function() {

  goog.base(this);

  this.setVisible(true);
  this.setOpacity(1);

};
goog.inherits(ol.LayerView, ol.MVCObject);


/**
 * @return {number} Opacity.
 */
ol.LayerView.prototype.getOpacity = function() {
  return /** @type {number} */ (this.get(ol.LayerViewProperty_.OPACITY));
};


/**
 * @return {boolean} Visible.
 */
ol.LayerView.prototype.getVisible = function() {
  return /** @type {boolean} */ (this.get(ol.LayerViewProperty_.VISIBLE));
};


/**
 * @param {number} opacity Opacity.
 */
ol.LayerView.prototype.setOpacity = function(opacity) {
  this.set(ol.LayerViewProperty_.OPACITY, opacity);
};


/**
 * @param {boolean} visible Visible.
 */
ol.LayerView.prototype.setVisible = function(visible) {
  this.set(ol.LayerViewProperty_.VISIBLE, visible);
};
