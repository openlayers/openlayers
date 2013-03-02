goog.provide('ol.geom.LineString');

goog.require('goog.asserts');
goog.require('ol.Extent');
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
   * @type {string}
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
    var minX,
        minY = minX = Number.POSITIVE_INFINITY,
        maxX,
        maxY = maxX = Number.NEGATIVE_INFINITY,
        vertices = this.vertices,
        id = this.sharedId_,
        count = vertices.getCount(id),
        dimension = this.dimension,
        x, y, i;

    for (i = 0; i < count; ++i) {
      x = vertices.get(id, i, 0);
      y = vertices.get(id, i, 1);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    this.bounds_ = new ol.Extent(minX, minY, maxX, maxY);
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
 * @return {string} The identifier.
 */
ol.geom.LineString.prototype.getSharedId = function() {
  return this.sharedId_;
};
