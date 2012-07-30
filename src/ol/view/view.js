goog.provide('ol.View');

goog.require('ol.Map');



/**
 * @constructor
 * @param {ol.Map} map Map.
 */
ol.View = function(map) {

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = map;

};


/**
 * @return {Element} Element.
 */
ol.View.prototype.getElement = goog.abstractMethod;


/**
 * @return {ol.Map} Map.
 */
ol.View.prototype.getMap = function() {
  return this.map_;
};
