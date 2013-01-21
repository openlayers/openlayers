goog.provide('ol.geom.MultiLineString');

goog.require('goog.asserts');
goog.require('ol.geom.CoordinateArray');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');



/**
 * @constructor
 * @extends {ol.geom.GeometryCollection}
 * @param {Array.<ol.geom.CoordinateArray>} coordinates Coordinates array.
 */
ol.geom.MultiLineString = function(coordinates) {
  goog.base(this);

  var numParts = coordinates.length,
      dimension;

  /**
   * @type {Array.<ol.geom.LineString>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.LineString(coordinates[i]);
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
goog.inherits(ol.geom.MultiLineString, ol.geom.GeometryCollection);
