goog.provide('ol.geom.MultiPoint');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.extent');
goog.require('ol.geom.GeometryLayout');
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
  this.setCoordinates(coordinates, opt_layout);
};
goog.inherits(ol.geom.MultiPoint, ol.geom.SimpleGeometry);


/**
 * Append the passed point to this multipoint.
 * @param {ol.geom.Point} point Point.
 * @api stable
 */
ol.geom.MultiPoint.prototype.appendPoint = function(point) {
  goog.asserts.assert(point.getLayout() == this.layout,
      'the layout of point should match layout');
  if (!this.flatCoordinates) {
    this.flatCoordinates = point.getFlatCoordinates().slice();
  } else {
    goog.array.extend(this.flatCoordinates, point.getFlatCoordinates());
  }
  this.changed();
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
 * Return the coordinates of the multipoint.
 * @return {Array.<ol.Coordinate>} Coordinates.
 * @api stable
 */
ol.geom.MultiPoint.prototype.getCoordinates = function() {
  return ol.geom.flat.inflate.coordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * Return the point at the specified index.
 * @param {number} index Index.
 * @return {ol.geom.Point} Point.
 * @api stable
 */
ol.geom.MultiPoint.prototype.getPoint = function(index) {
  var n = !this.flatCoordinates ?
      0 : this.flatCoordinates.length / this.stride;
  goog.asserts.assert(0 <= index && index < n,
      'index should be in between 0 and n');
  if (index < 0 || n <= index) {
    return null;
  }
  var point = new ol.geom.Point(null);
  point.setFlatCoordinates(this.layout, this.flatCoordinates.slice(
      index * this.stride, (index + 1) * this.stride));
  return point;
};


/**
 * Return the points of this multipoint.
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
 * @inheritDoc
 * @api stable
 */
ol.geom.MultiPoint.prototype.intersectsExtent = function(extent) {
  var flatCoordinates = this.flatCoordinates;
  var stride = this.stride;
  var i, ii, x, y;
  for (i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    x = flatCoordinates[i];
    y = flatCoordinates[i + 1];
    if (ol.extent.containsXY(extent, x, y)) {
      return true;
    }
  }
  return false;
};


/**
 * Set the coordinates of the multipoint.
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.MultiPoint.prototype.setCoordinates =
    function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = ol.geom.flat.deflate.coordinates(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
ol.geom.MultiPoint.prototype.setFlatCoordinates =
    function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
