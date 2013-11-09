goog.provide('ol.geom2.Point');
goog.provide('ol.geom2.PointCollection');

goog.require('goog.asserts');
goog.require('ol.Extent');
goog.require('ol.geom2');
goog.require('ol.structs.Buffer');


/**
 * @typedef {Array.<number>}
 */
ol.geom2.Point;



/**
 * This is an internal class that will be removed from the API.
 * @constructor
 * @param {ol.structs.Buffer} buf Buffer.
 * @param {number=} opt_dim Dimension.
 * @todo stability experimental
 */
ol.geom2.PointCollection = function(buf, opt_dim) {

  /**
   * @type {ol.structs.Buffer}
   */
  this.buf = buf;

  /**
   * @type {number}
   */
  this.dim = goog.isDef(opt_dim) ? opt_dim : 2;

};


/**
 * This is an internal function that will be removed from the API.
 * @param {number} capacity Capacity.
 * @param {number=} opt_dim Dimension.
 * @return {ol.geom2.PointCollection} Point collection.
 * @todo stability experimental
 */
ol.geom2.PointCollection.createEmpty = function(capacity, opt_dim) {
  var dim = goog.isDef(opt_dim) ? opt_dim : 2;
  var buf = new ol.structs.Buffer(new Array(capacity * dim), 0);
  return new ol.geom2.PointCollection(buf, dim);
};


/**
 * This is an internal function that will be removed from the API.
 * @param {Array.<ol.geom2.Point>} unpackedPoints Unpacked points.
 * @param {number=} opt_capacity Capacity.
 * @param {number=} opt_dim Dimension.
 * @return {ol.geom2.PointCollection} Point collection.
 * @todo stability experimental
 */
ol.geom2.PointCollection.pack =
    function(unpackedPoints, opt_capacity, opt_dim) {
  var n = unpackedPoints.length;
  var dim = goog.isDef(opt_dim) ? opt_dim :
      n > 0 ? unpackedPoints[0].length : 2;
  var capacity = goog.isDef(opt_capacity) ? opt_capacity : n * dim;
  goog.asserts.assert(capacity >= n * dim);
  var arr = new Array(capacity);
  ol.geom2.packPoints(arr, 0, unpackedPoints, dim);
  var buf = new ol.structs.Buffer(arr, n * dim);
  return new ol.geom2.PointCollection(buf, dim);
};


/**
 * @param {ol.geom2.Point} point Point.
 * @return {number} Offset.
 * @todo stability experimental
 */
ol.geom2.PointCollection.prototype.add = function(point) {
  goog.asserts.assert(point.length == this.dim);
  return this.buf.add(point);
};


/**
 * @param {number} offset Offset.
 * @return {ol.geom2.Point} Point.
 */
ol.geom2.PointCollection.prototype.get = function(offset) {
  var arr = this.buf.getArray();
  var dim = this.dim;
  goog.asserts.assert(0 <= offset && offset + dim < arr.length);
  goog.asserts.assert(offset % dim === 0);
  return arr.slice(offset, offset + dim);
};


/**
 * @return {number} Count.
 */
ol.geom2.PointCollection.prototype.getCount = function() {
  return this.buf.getCount() / this.dim;
};


/**
 * @return {ol.Extent} Extent.
 */
ol.geom2.PointCollection.prototype.getExtent = function() {
  return ol.geom2.getExtent(this.buf, this.dim);
};


/**
 * @param {number} offset Offset.
 */
ol.geom2.PointCollection.prototype.remove = function(offset) {
  this.buf.remove(this.dim, offset);
};


/**
 * @param {number} offset Offset.
 * @param {ol.geom2.Point} point Point.
 */
ol.geom2.PointCollection.prototype.set = function(offset, point) {
  this.buf.set(point, offset);
};


/**
 * @return {Array.<ol.geom2.Point>} Points.
 */
ol.geom2.PointCollection.prototype.unpack = function() {
  var dim = this.dim;
  var n = this.getCount();
  var points = new Array(n);
  var i = 0;
  var bufArr = this.buf.getArray();
  this.buf.forEachRange(function(start, stop) {
    var j;
    for (j = start; j < stop; j += dim) {
      points[i++] = bufArr.slice(j, j + dim);
    }
  });
  goog.asserts.assert(i == n);
  return points;
};
