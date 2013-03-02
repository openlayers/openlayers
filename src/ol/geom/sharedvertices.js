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
  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {number}
   * @private
   */
  this.counter_ = 0;

  /**
   * @type {Array.<number>}
   */
  this.coordinates = [];

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

  /**
   * @type {Object}
   * @private
   */
  this.lookup_ = {};

  /**
   * @type {Array.<string>}
   * @private
   */
  this.ids_ = [];

};


/**
 * Adds a vertex array to the shared coordinate array.
 * @param {ol.geom.VertexArray} vertices Array of vertices.
 * @return {string} Index used to reference the added vertex array.
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
  var id = this.getId_();
  var idIndex = this.ids_.push(id) - 1;
  this.lookup_[id] = {
    idIndex: idIndex,
    start: start,
    count: count
  };
  return id;
};


/**
 * @param {string} id The vertex array identifier (returned by add).
 * @param {number} index The vertex index.
 * @param {number} dim The coordinate dimension.
 * @return {number} The coordinate value.
 */
ol.geom.SharedVertices.prototype.get = function(id, index, dim) {
  goog.asserts.assert(dim <= this.dimension_);
  goog.asserts.assert(this.lookup_.hasOwnProperty(id));
  goog.asserts.assert(index < this.lookup_[id].count);
  var start = this.lookup_[id].start;
  var value = this.coordinates[start + (index * this.dimension_) + dim];
  if (this.offset_) {
    value += this.offset_[dim];
  }
  return value;
};


/**
 * @param {string} id The vertex array identifier (returned by add).
 * @return {number} The number of vertices in the referenced array.
 */
ol.geom.SharedVertices.prototype.getCount = function(id) {
  goog.asserts.assert(this.lookup_.hasOwnProperty(id));
  return this.lookup_[id].count;
};


/**
 * Gets an identifier that is unique for this instance.
 * @return {string} Identifier.
 * @private
 */
ol.geom.SharedVertices.prototype.getId_ = function() {
  return String(++this.counter_);
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
 * @param {string} id The vertex array identifier (returned by add).
 * @return {number} The start index in the shared vertices array.
 */
ol.geom.SharedVertices.prototype.getStart = function(id) {
  goog.asserts.assert(this.lookup_.hasOwnProperty(id));
  return this.lookup_[id].start;
};


/**
 * @param {number} id The vertex array identifier (returned by add).
 * @return {ol.geom.VertexArray} The removed vertex array.
 */
ol.geom.SharedVertices.prototype.remove = function(id) {
  goog.asserts.assert(this.lookup_.hasOwnProperty(id));
  var info = this.lookup_[id];
  var dimension = this.dimension_;
  var length = info.count * dimension;
  var removed = this.coordinates.splice(info.start, length);
  var offset = this.offset_;
  var array = new Array(info.count);
  var vertex;
  for (var i = 0; i < info.count; ++i) {
    vertex = new Array(dimension);
    for (var j = 0; j < dimension; ++j) {
      vertex[j] = removed[(i * dimension) + j] + (offset ? offset[j] : 0);
    }
    array[i] = vertex;
  }
  delete this.lookup_[id];
  this.ids_.splice(info.idIndex, 1);
  var afterInfo;
  for (var k = info.idIndex, kk = this.ids_.length; k < kk; ++k) {
    afterInfo = this.lookup_[this.ids_[k]];
    afterInfo.idIndex -= 1;
    afterInfo.start -= length;
  }
  return array;
};
