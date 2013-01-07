goog.provide('ol.geom.MultiLineString');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {Array} coordinates Coordinates array.
 */
ol.geom.MultiLineString = function(coordinates) {

  /**
   * @type {Array}
   */
  this.coordinates = coordinates;

};
