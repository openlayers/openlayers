goog.provide('ol3.Control');

goog.require('ol3.Map');



/**
 * @constructor
 * @param {ol3.Map} map Map.
 */
ol3.Control = function(map) {

  /**
   * @private
   * @type {ol3.Map}
   */
  this.map_ = map;

};


/**
 * @return {Element} Element.
 */
ol3.Control.prototype.getElement = goog.abstractMethod;


/**
 * @return {ol3.Map} Map.
 */
ol3.Control.prototype.getMap = function() {
  return this.map_;
};
