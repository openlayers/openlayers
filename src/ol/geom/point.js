goog.provide('ol.geom.Point');

goog.require('goog.asserts');
goog.require('goog.vec.Float32Array');
goog.require('ol.geom.Coordinate');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {ol.geom.Coordinate} coordinates Coordinates array (e.g. [x, y]).
 */
ol.geom.Point = function(coordinates) {

  /**
   * @type {Float32Array}
   */
  this.coordinates = new Float32Array(coordinates);

  /**
   * @type {number}
   */
  this.dimension = coordinates.length;
  goog.asserts.assert(this.dimension >= 2);

};
