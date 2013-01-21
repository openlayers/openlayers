goog.provide('ol.geom.Point');

goog.require('goog.asserts');
goog.require('goog.vec.Float64Array');
goog.require('ol.geom.Coordinate');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {ol.geom.Coordinate} coordinates Coordinates array (e.g. [x, y]).
 */
ol.geom.Point = function(coordinates) {

  /**
   * @type {Float64Array}
   */
  this.coordinates = new Float64Array(coordinates);

  /**
   * @type {number}
   */
  this.dimension = coordinates.length;
  goog.asserts.assert(this.dimension >= 2);

};
