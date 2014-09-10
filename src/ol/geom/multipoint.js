goog.provide('ol.geom.MultiPoint');

goog.require('goog.asserts');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Point');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.deflate');
goog.require('ol.geom.flat.inflate');
goog.require('ol.math');



/**
 * @classdesc
 * Multi-point geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.MultiPoint = function(coordinates, opt_layout) {
  goog.base(this);
  this.setCoordinates(coordinates,
      /** @type {ol.geom.GeometryLayout|undefined} */ (opt_layout));
};
goog.inherits(ol.geom.MultiPoint, ol.geom.SimpleGeometry);


/**
 * @param {ol.geom.Point} point Point.
 * @api stable
 */
ol.geom.MultiPoint.prototype.appendPoint = function(point) {
  goog.asserts.assert(point.getLayout() == this.layout);
  if (goog.isNull(this.flatCoordinates)) {
    this.flatCoordinates = point.getFlatCoordinates().slice();
  } else {
    ol.array.safeExtend(this.flatCoordinates, point.getFlatCoordinates());
  }
  this.dispatchChangeEvent();
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.MultiPoint} Clone.
 * @api stable
 */
ol.geom.MultiPoint.prototype.clone = function() {
  var multiPoint = new ol.geom.MultiPoint(null);
  multiPoint.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return multiPoint;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPoint.prototype.closestPointXY =
    function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      ol.extent.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  var flatCoordinates = this.flatCoordinates;
  var stride = this.stride;
  var i, ii, j;
  for (i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    var squaredDistance = ol.math.squaredDistance(
        x, y, flatCoordinates[i], flatCoordinates[i + 1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      for (j = 0; j < stride; ++j) {
        closestPoint[j] = flatCoordinates[i + j];
      }
      closestPoint.length = stride;
    }
  }
  return minSquaredDistance;
};


/**
 * @return {Array.<ol.Coordinate>} Coordinates.
 * @api stable
 */
ol.geom.MultiPoint.prototype.getCoordinates = function() {
  return ol.geom.flat.inflate.coordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @param {number} index Index.
 * @return {ol.geom.Point} Point.
 * @api stable
 */
ol.geom.MultiPoint.prototype.getPoint = function(index) {
  var n = goog.isNull(this.flatCoordinates) ?
      0 : this.flatCoordinates.length / this.stride;
  goog.asserts.assert(0 <= index && index < n);
  if (index < 0 || n <= index) {
    return null;
  }
  var point = new ol.geom.Point(null);
  point.setFlatCoordinates(this.layout, this.flatCoordinates.slice(
      index * this.stride, (index + 1) * this.stride));
  return point;
};


/**
 * @return {Array.<ol.geom.Point>} Points.
 * @api stable
 */
ol.geom.MultiPoint.prototype.getPoints = function() {
  var flatCoordinates = this.flatCoordinates;
  var layout = this.layout;
  var stride = this.stride;
  /** @type {Array.<ol.geom.Point>} */
  var points = [];
  var i, ii;
  for (i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    var point = new ol.geom.Point(null);
    point.setFlatCoordinates(layout, flatCoordinates.slice(i, i + stride));
    points.push(point);
  }
  return points;
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.MultiPoint.prototype.getType = function() {
  return ol.geom.GeometryType.MULTI_POINT;
};


/**
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.MultiPoint.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  if (goog.isNull(coordinates)) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 1);
    if (goog.isNull(this.flatCoordinates)) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = ol.geom.flat.deflate.coordinates(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
ol.geom.MultiPoint.prototype.setFlatCoordinates =
    function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.dispatchChangeEvent();
};
