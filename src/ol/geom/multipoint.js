goog.provide('ol.geom.MultiPoint');

goog.require('goog.asserts');
goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.Point');



/**
 * @constructor
 * @implements {ol.geom.Geometry}
 * @param {ol.geom.CoordinateArray} coordinates Coordinates array.
 */
ol.geom.MultiPoint = function(coordinates) {

  var numParts = coordinates.length,
      dimension;

  /**
   * @type {Array.<ol.geom.Point>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.Point(coordinates[i]);
    if (!goog.isDef(dimension)) {
      dimension = this.components[i].dimension;
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
