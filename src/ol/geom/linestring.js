goog.provide('ol.geom.LineString');

goog.require('goog.asserts');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.SharedVertices');
goog.require('ol.geom.VertexArray');



/**
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {ol.geom.VertexArray} coordinates Vertex array (e.g.
 *    [[x0, y0], [x1, y1]]).
 * @param {ol.geom.SharedVertices=} opt_shared Shared vertices.
 */
ol.geom.LineString = function(coordinates, opt_shared) {
  goog.base(this);
  goog.asserts.assert(goog.isArray(coordinates[0]));

  var vertices = opt_shared,
      dimension;

  if (!goog.isDef(vertices)) {
    dimension = coordinates[0].length;
    vertices = new ol.geom.SharedVertices({dimension: dimension});
  }

  /**
   * @type {ol.geom.SharedVertices}
   */
  this.vertices = vertices;

  /**
   * @type {number}
   * @private
   */
  this.sharedId_ = vertices.add(coordinates);

  /**
   * @type {number}
   */
  this.dimension = vertices.getDimension();
  goog.asserts.assert(this.dimension >= 2);

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
  return this.vertices.get(this.sharedId_, index, dim);
};


/**
 * @inheritDoc
 * @return {ol.geom.VertexArray} Coordinates array.
 */
ol.geom.LineString.prototype.getCoordinates = function() {
  var count = this.getCount();
  var coordinates = new Array(count);
  var vertex;
  for (var i = 0; i < count; ++i) {
    vertex = new Array(this.dimension);
    for (var j = 0; j < this.dimension; ++j) {
      vertex[j] = this.get(i, j);
    }
    coordinates[i] = vertex;
  }
  return coordinates;
};


/**
 * Get the count of vertices in this linestring.
 * @return {number} The vertex count.
 */
ol.geom.LineString.prototype.getCount = function() {
  return this.vertices.getCount(this.sharedId_);
};


/**
 * @inheritDoc
 */
ol.geom.LineString.prototype.getBounds = function() {
  if (goog.isNull(this.bounds_)) {
    var dimension = this.dimension,
        vertices = this.vertices,
        id = this.sharedId_,
        count = vertices.getCount(id),
        start = vertices.getStart(id),
        end = start + (count * dimension),
        coordinates = vertices.coordinates,
        minX, maxX,
        minY, maxY,
        x, y, i;

    minX = maxX = coordinates[start];
    minY = maxY = coordinates[start + 1];
    for (i = start + dimension; i < end; i += dimension) {
      x = coordinates[i];
      y = coordinates[i + 1];
      if (x < minX) {
        minX = x;
      } else if (x > maxX) {
        maxX = x;
      }
      if (y < minY) {
        minY = y;
      } else if (y > maxY) {
        maxY = y;
      }
    }
    this.bounds_ = [minX, maxX, minY, maxY];
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
 * Get the identifier used to mark this line in the shared vertices structure.
 * @return {number} The identifier.
 */
ol.geom.LineString.prototype.getSharedId = function() {
  return this.sharedId_;
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
    dist2 = Math.min(dist2, ol.geom.squaredDistanceToSegment(coordinate,
        [coordinates[i], coordinates[j]]));
  }
  return Math.sqrt(dist2);
};
