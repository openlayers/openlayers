goog.provide('ol.geom.MultiPoint');

goog.require('goog.asserts');
goog.require('ol.CoordinateArray');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');



/**
 * @constructor
 * @extends {ol.geom.AbstractCollection}
 * @param {ol.CoordinateArray} coordinates Coordinates array.
 */
ol.geom.MultiPoint = function(coordinates) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0]));

  var numParts = coordinates.length;

  /**
   * @type {Array.<ol.geom.Point>}
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    this.components[i] = new ol.geom.Point(coordinates[i]);
  }

};
goog.inherits(ol.geom.MultiPoint, ol.geom.AbstractCollection);


/**
 * @inheritDoc
 */
ol.geom.MultiPoint.prototype.getType = function() {
  return ol.geom.GeometryType.MULTIPOINT;
};


/**
 * Create a multi-point geometry from an array of point geometries.
 *
 * @param {Array.<ol.geom.Point>} geometries Array of geometries.
 * @return {ol.geom.MultiPoint} A new geometry.
 */
ol.geom.MultiPoint.fromParts = function(geometries) {
  var count = geometries.length;
  var coordinates = new Array(count);
  for (var i = 0; i < count; ++i) {
    coordinates[i] = geometries[i].getCoordinates();
  }
  return new ol.geom.MultiPoint(coordinates);
};
