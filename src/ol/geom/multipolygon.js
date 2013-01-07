goog.provide('ol.geom.MultiPolygon');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {Array} coordinates Coordinates array.
 */
ol.geom.MultiPolygon = function(coordinates) {

  /**
   * @type {Array}
   */
  this.coordinates = coordinates;

};
