goog.provide('ol.control.Control');

goog.require('ol.Map');



/**
 * @constructor
 * @param {ol.Map} map Map.
 */
ol.control.Control = function(map) {

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = map;

};


/**
 * @return {Element} Element.
 */
ol.control.Control.prototype.getElement = goog.abstractMethod;


/**
 * @return {ol.Map} Map.
 */
ol.control.Control.prototype.getMap = function() {
  return this.map_;
};
