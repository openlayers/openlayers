goog.provide('ol.geom.Polygon');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {Array} coordinates Coordinates array.
 */
ol.geom.Polygon = function(coordinates) {

  /**
   * @type {Array}
   */
  this.coordinates = coordinates;

};
