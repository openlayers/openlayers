goog.provide('ol.geom.LineString');

goog.require('goog.asserts');
goog.require('goog.vec.Float64Array');
goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {ol.geom.CoordinateArray} coordinates Coordinates array (e.g.
 *    [[x0, y0], [x1, y1]]).
 */
ol.geom.LineString = function(coordinates) {

  // assume the same dimension for all coordinates
  var dimension = coordinates[0].length,
      count = coordinates.length,
      length = count * dimension;

  /**
   * @type {Float64Array}
   */
  this.coordinates = new Float64Array(length);
  for (var i = 0; i < count; ++i) {
    goog.asserts.assert(coordinates[i].length === dimension);
    this.coordinates.set(coordinates[i], i * dimension);
  }

  /**
   * @type {number}
   */
  this.dimension = dimension;
  goog.asserts.assert(this.dimension >= 2);

};
