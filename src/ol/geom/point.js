goog.provide('ol.geom.Point');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {Array} coordinates Coordinates array.
 */
ol.geom.Point = function(coordinates) {

  /**
   * @type {Array}
   */
  this.coordinates = coordinates;

};
