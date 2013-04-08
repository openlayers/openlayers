goog.provide('ol.geom.SharedVertices');

goog.require('goog.asserts');
goog.require('ol.geom.Vertex');
goog.require('ol.geom.VertexArray');


/**
 * @typedef {{dimension: (number),
 *            offset: (ol.geom.Vertex|undefined)}}
 */
ol.geom.SharedVerticesOptions;



/**
 * Provides methods for dealing with shared, flattened arrays of vertices.
 *
 * @constructor
 * @param {ol.geom.SharedVerticesOptions=} opt_options Shared vertices options.
 */
ol.geom.SharedVertices = function(opt_options) {
  var options = opt_options ? opt_options : {};

  /**
   * @type {Array.<number>}
   */
  this.coordinates = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.starts_ = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.counts_ = [];

  /**
   * Number of dimensions per vertex.  Default is 2.
   * @type {number}
   * @private
   */
  this.dimension_ = options.dimension || 2;

  /**
   * Vertex offset.
   * @type {Array.<number>}
   * @private
   */
  this.offset_ = options.offset || null;
  goog.asserts.assert(goog.isNull(this.offset_) ||
      this.offset_.length === this.dimension_);

};


/**
 * Adds a vertex array to the shared coordinate array.
 * @param {ol.geom.VertexArray} vertices Array of vertices.
 * @return {number} Index used to reference the added vertex array.
 */
ol.geom.SharedVertices.prototype.add = function(vertices) {
  var start = this.coordinates.length;
  var offset = this.offset_;
  var dimension = this.dimension_;
  var count = vertices.length;
  var vertex, index;
  for (var i = 0; i < count; ++i) {
    vertex = vertices[i];
    goog.asserts.assert(vertex.length == dimension);
    if (!offset) {
      Array.prototype.push.apply(this.coordinates, vertex);
    } else {
      index = start + (i * dimension);
      for (var j = 0; j < dimension; ++j) {
        this.coordinates[index + j] = vertex[j] - offset[j];
      }
    }
  }
  var length = this.starts_.push(start);
  this.counts_.push(count);
  return length - 1;
};


/**
 * @param {number} id The vertex array identifier (returned by add).
 * @param {number} index The vertex index.
 * @param {number} dim The coordinate dimension.
 * @return {number} The coordinate value.
 */
ol.geom.SharedVertices.prototype.get = function(id, index, dim) {
  goog.asserts.assert(id < this.starts_.length);
  goog.asserts.assert(dim <= this.dimension_);
  goog.asserts.assert(index < this.counts_[id]);
  var start = this.starts_[id];
  var value = this.coordinates[start + (index * this.dimension_) + dim];
  if (this.offset_) {
    value += this.offset_[dim];
  }
  return value;
};


/**
 * @param {number} id The vertex array identifier (returned by add).
 * @return {number} The number of vertices in the referenced array.
 */
ol.geom.SharedVertices.prototype.getCount = function(id) {
  goog.asserts.assert(id < this.counts_.length);
  return this.counts_[id];
};


/**
 * Get the array of counts.  The index returned by the add method can be used
 * to look up the number of vertices.
 *
 * @return {Array.<number>} The counts array.
 */
ol.geom.SharedVertices.prototype.getCounts = function() {
  return this.counts_;
};


/**
 * @return {number} The dimension of each vertex in the array.
 */
ol.geom.SharedVertices.prototype.getDimension = function() {
  return this.dimension_;
};


/**
 * @return {Array.<number>} The offset array for vertex coordinates (or null).
 */
ol.geom.SharedVertices.prototype.getOffset = function() {
  return this.offset_;
};


/**
 * @param {number} id The vertex array identifier (returned by add).
 * @return {number} The start index in the shared vertices array.
 */
ol.geom.SharedVertices.prototype.getStart = function(id) {
  goog.asserts.assert(id < this.starts_.length);
  return this.starts_[id];
};


/**
 * Get the array of start indexes.
 * @return {Array.<number>} The starts array.
 */
ol.geom.SharedVertices.prototype.getStarts = function() {
  return this.starts_;
};
