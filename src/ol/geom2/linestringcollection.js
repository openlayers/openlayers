goog.provide('ol.geom2.LineString');
goog.provide('ol.geom2.LineStringCollection');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.geom2');
goog.require('ol.structs.Buffer');


/**
 * @typedef {Array.<Array.<number>>}
 */
ol.geom2.LineString;



/**
 * This is an internal class that will be removed from the API.
 * @constructor
 * @param {ol.structs.Buffer} buf Buffer.
 * @param {Object.<string, number>=} opt_ranges Ranges.
 * @param {number=} opt_dim Dimension.
 * @todo stability experimental
 */
ol.geom2.LineStringCollection = function(buf, opt_ranges, opt_dim) {

  /**
   * @type {ol.structs.Buffer}
   */
  this.buf = buf;

  /**
   * @type {Object.<string, number>}
   */
  this.ranges = goog.isDef(opt_ranges) ? opt_ranges : {};

  /**
   * @type {number}
   */
  this.dim = goog.isDef(opt_dim) ? opt_dim : 2;

};


/**
 * @param {number} capacity Capacity.
 * @param {number=} opt_dim Dimension.
 * @return {ol.geom2.LineStringCollection} Line string collection.
 */
ol.geom2.LineStringCollection.createEmpty = function(capacity, opt_dim) {
  var dim = goog.isDef(opt_dim) ? opt_dim : 2;
  var buf = new ol.structs.Buffer(new Array(capacity * dim), 0);
  return new ol.geom2.LineStringCollection(buf, undefined, dim);
};


/**
 * This is an internal function that will be removed from the API.
 * @param {Array.<ol.geom2.LineString>} unpackedLineStrings Unpacked line
 *     strings.
 * @param {number=} opt_capacity Capacity.
 * @param {number=} opt_dim Dimension.
 * @return {ol.geom2.LineStringCollection} Line string collection.
 * @todo stability experimental
 */
ol.geom2.LineStringCollection.pack =
    function(unpackedLineStrings, opt_capacity, opt_dim) {
  var i;
  var n = unpackedLineStrings.length;
  var dim = goog.isDef(opt_dim) ? opt_dim :
      n > 0 ? unpackedLineStrings[0][0].length : 2;
  var capacity;
  if (goog.isDef(opt_capacity)) {
    capacity = opt_capacity;
  } else {
    capacity = 0;
    for (i = 0; i < n; ++i) {
      capacity += unpackedLineStrings[i].length;
    }
  }
  capacity *= dim;
  var arr = new Array(capacity);
  /** @type {Object.<string, number>} */
  var ranges = {};
  var offset = 0;
  var start;
  for (i = 0; i < n; ++i) {
    goog.asserts.assert(unpackedLineStrings[i].length > 1);
    start = offset;
    offset = ol.geom2.packPoints(arr, offset, unpackedLineStrings[i], dim);
    ranges[start + ''] = offset;
  }
  goog.asserts.assert(offset <= capacity);
  var buf = new ol.structs.Buffer(arr, offset);
  return new ol.geom2.LineStringCollection(buf, ranges, dim);
};


/**
 * @param {ol.geom2.LineString} lineString Line string.
 * @return {number} Offset.
 */
ol.geom2.LineStringCollection.prototype.add = function(lineString) {
  var n = lineString.length * this.dim;
  var offset = this.buf.allocate(n);
  goog.asserts.assert(offset != -1);
  this.ranges[offset + ''] = offset + n;
  ol.geom2.packPoints(this.buf.getArray(), offset, lineString, this.dim);
  return offset;
};


/**
 * @param {number} offset Offset.
 * @return {ol.geom2.LineString} Line string.
 */
ol.geom2.LineStringCollection.prototype.get = function(offset) {
  goog.asserts.assert(offset in this.ranges);
  var range = this.ranges[offset + ''];
  return ol.geom2.unpackPoints(
      this.buf.getArray(), offset, range, this.dim);
};


/**
 * @return {number} Count.
 */
ol.geom2.LineStringCollection.prototype.getCount = function() {
  return goog.object.getCount(this.ranges);
};


/**
 * @return {ol.Extent} Extent.
 */
ol.geom2.LineStringCollection.prototype.getExtent = function() {
  return ol.geom2.getExtent(this.buf, this.dim);
};


/**
 * @return {Uint16Array} Indices.
 */
ol.geom2.LineStringCollection.prototype.getIndices = function() {
  // FIXME cache and track dirty / track output length
  var dim = this.dim;
  var offsets = goog.array.map(goog.object.getKeys(this.ranges), Number);
  goog.array.sort(offsets);
  var n = offsets.length;
  var indices = [];
  var i, j, range, offset, stop;
  for (i = 0; i < n; ++i) {
    offset = offsets[i];
    range = this.ranges[offset];
    stop = range / dim - 1;
    for (j = offset / dim; j < stop; ++j) {
      indices.push(j, j + 1);
    }
  }
  return new Uint16Array(indices);
};


/**
 * @param {number} offset Offset.
 */
ol.geom2.LineStringCollection.prototype.remove = function(offset) {
  goog.asserts.assert(offset in this.ranges);
  var range = this.ranges[offset + ''];
  this.buf.remove(range - offset, offset);
  delete this.ranges[offset + ''];
};


/**
 * @param {number} offset Offset.
 * @param {ol.geom2.LineString} lineString Line string.
 * @return {number} Offset.
 */
ol.geom2.LineStringCollection.prototype.set = function(offset, lineString) {
  var dim = this.dim;
  goog.asserts.assert(offset in this.ranges);
  var range = this.ranges[offset + ''];
  if (lineString.length * dim == range - offset) {
    ol.geom2.packPoints(this.buf.getArray(), offset, lineString, dim);
    this.buf.markDirty(range - offset, offset);
    return offset;
  } else {
    this.remove(offset);
    return this.add(lineString);
  }
};


/**
 * @return {Array.<ol.geom2.LineString>} Line strings.
 */
ol.geom2.LineStringCollection.prototype.unpack = function() {
  var dim = this.dim;
  var n = this.getCount();
  var lineStrings = new Array(n);
  var i = 0;
  var offset, range;
  for (offset in this.ranges) {
    range = this.ranges[offset];
    lineStrings[i++] = ol.geom2.unpackPoints(
        this.buf.getArray(), Number(offset), range, dim);
  }
  return lineStrings;
};
