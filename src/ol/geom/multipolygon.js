goog.provide('ol.geom.MultiPolygon');

goog.require('goog.asserts');
goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {Array.<Array.<ol.geom.CoordinateArray>>} coordinates Coordinates
 *    array.
 */
ol.geom.MultiPolygon = function(coordinates) {

  var numParts = coordinates.length,
      dimension;

  /**
   * @type {Array.<ol.geom.Polygon>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.Polygon(coordinates[i]);
    if (!goog.isDef(dimension)) {
      dimension = this.components[i];
    } else {
      goog.asserts.assert(this.components[i].dimension === dimension);
    }
  }

  /**
   * @type {number}
   */
  this.dimension = dimension;
  goog.asserts.assert(this.dimension >= 2);

};
