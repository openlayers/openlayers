goog.provide('ol.geom.LineString');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {Array} coordinates Coordinates array.
 */
ol.geom.LineString = function(coordinates) {

  /**
   * @type {Array}
   */
  this.coordinates = coordinates;

};
