goog.provide('ol.geom.LineString');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('ol.CoordinateArray');
goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryEvent');
goog.require('ol.geom.GeometryType');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.CoordinateArray} coordinates Array of coordinates (e.g.
 *    [[x0, y0], [x1, y1]]).
 * @todo stability experimental
 */
ol.geom.LineString = function(coordinates) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0]));

  /**
   * Array of coordinates.
   * @type {ol.CoordinateArray}
   * @private
   */
  this.coordinates_ = coordinates;

  /**
   * @type {ol.Extent}
   * @private
   */
  this.bounds_ = null;

};
goog.inherits(ol.geom.LineString, ol.geom.Geometry);


/**
 * Get a vertex coordinate value for the given dimension.
 * @param {number} index Vertex index.
 * @param {number} dim Coordinate dimension.
 * @return {number} The vertex coordinate value.
 */
ol.geom.LineString.prototype.get = function(index, dim) {
  var coordinates = this.getCoordinates();
  goog.asserts.assert(coordinates.length > index);
  return coordinates[index][dim];
};


/**
 * @inheritDoc
 * @return {ol.CoordinateArray} Coordinates array.
 */
ol.geom.LineString.prototype.getCoordinates = function() {
  return this.coordinates_;
};


/**
 * Get the count of vertices in this linestring.
 * @return {number} The vertex count.
 */
ol.geom.LineString.prototype.getCount = function() {
  return this.getCoordinates().length;
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getBounds = function() {
  if (goog.isNull(this.bounds_)) {
    var coordinates = this.getCoordinates();
    var extent = ol.extent.createEmpty();
    for (var i = 0, ii = coordinates.length; i < ii; ++i) {
      ol.extent.extendCoordinate(extent, coordinates[i]);
    }
    this.bounds_ = extent;
  }
  return this.bounds_;
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getType = function() {
  return ol.geom.GeometryType.LINESTRING;
};


/**
 * Calculate the distance from a coordinate to this linestring.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {number} Distance from the coordinate to this linestring.
 */
ol.geom.LineString.prototype.distanceFromCoordinate = function(coordinate) {
  var coordinates = this.getCoordinates();
  var dist2 = Infinity;
  for (var i = 0, j = 1, len = coordinates.length; j < len; i = j++) {
    dist2 = Math.min(dist2, ol.coordinate.squaredDistanceToSegment(coordinate,
        [coordinates[i], coordinates[j]]));
  }
  return Math.sqrt(dist2);
};


/**
 * Update the linestring coordinates.
 * @param {ol.CoordinateArray} coordinates Coordinates array.
 */
ol.geom.LineString.prototype.setCoordinates = function(coordinates) {
  var oldBounds = this.bounds_;
  this.bounds_ = null;
  this.coordinates_ = coordinates;
  this.dispatchEvent(new ol.geom.GeometryEvent(goog.events.EventType.CHANGE,
      this, oldBounds));
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.transform = function(transform) {
  var coordinates = this.getCoordinates();
  var coord;
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    coord = coordinates[i];
    transform(coord, coord, coord.length);
  }
  this.setCoordinates(coordinates); // for change event
};
