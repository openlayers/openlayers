goog.provide('ol.geom.MultiPoint');

goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {Array} coordinates Coordinates array.
 */
ol.geom.MultiPoint = function(coordinates) {

  /**
   * @type {Array}
   */
  this.coordinates = coordinates;

};
