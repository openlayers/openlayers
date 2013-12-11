goog.provide('ol.geom.MultiPoint');

goog.require('ol.extent');
goog.require('ol.geom.Point');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat');



/**
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {ol.geom.RawMultiPoint} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 */
ol.geom.MultiPoint = function(coordinates, opt_layout) {
  goog.base(this);
  this.setCoordinates(coordinates, opt_layout);
};
goog.inherits(ol.geom.MultiPoint, ol.geom.SimpleGeometry);


/**
 * @inheritDoc
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
  var i, ii;
  for (i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    var squaredDistance = ol.geom.flat.squaredDistance(
        x, y, flatCoordinates[i], flatCoordinates[i + 1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      closestPoint[0] = flatCoordinates[i];
      closestPoint[1] = flatCoordinates[i + 1];
    }
  }
  return minSquaredDistance;
};


/**
 * @return {ol.geom.RawMultiPoint} Coordinates.
 */
ol.geom.MultiPoint.prototype.getCoordinates = function() {
  return ol.geom.flat.inflateCoordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @return {Array.<ol.geom.Point>} Points.
 */
ol.geom.MultiPoint.prototype.getPoints = function() {
  // FIXME we should construct the points from the flat coordinates
  var coordinates = this.getCoordinates();
  var points = [];
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    points.push(new ol.geom.Point(coordinates[i]));
  }
  return points;
};


/**
 * @inheritDoc
 */
ol.geom.MultiPoint.prototype.getType = function() {
  return ol.geom.GeometryType.MULTI_POINT;
};


/**
 * @param {ol.geom.RawMultiPoint} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
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
    this.flatCoordinates.length = ol.geom.flat.deflateCoordinates(
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
