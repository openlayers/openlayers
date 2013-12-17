goog.provide('ol.geom.MultiLineString');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.CoordinateArray');
goog.require('ol.geom.AbstractCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');



/**
 * @constructor
 * @extends {ol.geom.AbstractCollection}
 * @param {Array.<ol.CoordinateArray>} coordinates Coordinates array.
 * @todo stability experimental
 */
ol.geom.MultiLineString = function(coordinates) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0][0]));

  var numParts = coordinates.length;

  /**
   * @type {Array.<ol.geom.LineString>}
   * @protected
   */
  this.components = new Array(numParts);
  for (var i = 0; i < numParts; ++i) {
    var component = new ol.geom.LineString(coordinates[i]);
    this.components[i] = component;
    goog.events.listen(component, goog.events.EventType.CHANGE,
        this.handleComponentChange, false, this);
  }

};
goog.inherits(ol.geom.MultiLineString, ol.geom.AbstractCollection);


/**
 * @inheritDoc
 */
ol.geom.MultiLineString.prototype.getType = function() {
  return ol.geom.GeometryType.MULTILINESTRING;
};


/**
 * Calculate the distance from a coordinate to this multilinestring. This is
 * the closest distance of the coordinate to one of this multilinestring's
 * components.<
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {number} Distance from the coordinate to this multilinestring.
 */
ol.geom.MultiLineString.prototype.distanceFromCoordinate =
    function(coordinate) {
  var distance = Infinity;
  for (var i = 0, ii = this.components.length; i < ii; ++i) {
    distance = Math.min(distance,
        this.components[i].distanceFromCoordinate(coordinate));
  }
  return distance;
};


/**
 * Create a multi-linestring geometry from an array of linestring geometries.
 *
 * @param {Array.<ol.geom.LineString>} geometries Array of geometries.
 * @return {ol.geom.MultiLineString} A new geometry.
 */
ol.geom.MultiLineString.fromParts = function(geometries) {
  var count = geometries.length;
  var coordinates = new Array(count);
  for (var i = 0; i < count; ++i) {
    coordinates[i] = geometries[i].getCoordinates();
  }
  return new ol.geom.MultiLineString(coordinates);
};
