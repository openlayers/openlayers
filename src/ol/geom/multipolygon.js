goog.provide('ol.geom.MultiPolygon');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.CoordinateArray');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Polygon');



/**
 * @constructor
 * @extends {ol.geom.AbstractCollection}
 * @param {Array.<Array.<ol.CoordinateArray>>} coordinates Coordinates
 *    array.
 * @todo stability experimental
 */
ol.geom.MultiPolygon = function(coordinates) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0][0][0]));

  var numParts = coordinates.length;

  /**
   * @type {Array.<ol.geom.Polygon>}
   * @protected
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    var component = new ol.geom.Polygon(coordinates[i]);
    this.components[i] = component;
    goog.events.listen(component, goog.events.EventType.CHANGE,
        this.handleComponentChange, false, this);
  }

};
goog.inherits(ol.geom.MultiPolygon, ol.geom.AbstractCollection);


/**
 * @inheritDoc
 */
ol.geom.MultiPolygon.prototype.getType = function() {
  return ol.geom.GeometryType.MULTIPOLYGON;
};


/**
 * Check whether a given coordinate is inside this multipolygon.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Whether the coordinate is inside the multipolygon.
 */
ol.geom.MultiPolygon.prototype.containsCoordinate = function(coordinate) {
  var containsCoordinate = false;
  for (var i = 0, ii = this.components.length; i < ii; ++i) {
    if (this.components[i].containsCoordinate(coordinate)) {
      containsCoordinate = true;
      break;
    }
  }
  return containsCoordinate;
};


/**
 * Create a multi-polygon geometry from an array of polygon geometries.
 *
 * @param {Array.<ol.geom.Polygon>} geometries Array of geometries.
 * @return {ol.geom.MultiPolygon} A new geometry.
 */
ol.geom.MultiPolygon.fromParts = function(geometries) {
  var count = geometries.length;
  var coordinates = new Array(count);
  for (var i = 0; i < count; ++i) {
    coordinates[i] = geometries[i].getCoordinates();
  }
  return new ol.geom.MultiPolygon(coordinates);
};
