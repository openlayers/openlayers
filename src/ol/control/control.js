goog.provide('ol.Control');

goog.require('ol.Map');



/**
 * @constructor
 * @param {ol.Map} map Map.
 */
ol.Control = function(map) {

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = map;

};


/**
 * @return {Element} Element.
 */
ol.Control.prototype.getElement = goog.abstractMethod;


/**
 * @return {ol.Map} Map.
 */
ol.Control.prototype.getMap = function() {
  return this.map_;
};
