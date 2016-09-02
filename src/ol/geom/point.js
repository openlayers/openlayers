goog.provide('ol.geom.Point');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.geom.GeometryLayout');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.SimpleGeometry');
goog.require('ol.geom.flat.deflate');
goog.require('ol.math');


/**
 * @classdesc
 * Point geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {ol.Coordinate} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.Point = function(coordinates, opt_layout) {
  ol.geom.SimpleGeometry.call(this);
  this.setCoordinates(coordinates, opt_layout);
};
ol.inherits(ol.geom.Point, ol.geom.SimpleGeometry);


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.Point} Clone.
 * @api stable
 */
ol.geom.Point.prototype.clone = function() {
  var point = new ol.geom.Point(null);
  point.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return point;
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  var flatCoordinates = this.flatCoordinates;
  var squaredDistance = ol.math.squaredDistance(
      x, y, flatCoordinates[0], flatCoordinates[1]);
  if (squaredDistance < minSquaredDistance) {
    var stride = this.stride;
    var i;
    for (i = 0; i < stride; ++i) {
      closestPoint[i] = flatCoordinates[i];
    }
    closestPoint.length = stride;
    return squaredDistance;
  } else {
    return minSquaredDistance;
  }
};


/**
 * Return the coordinate of the point.
 * @return {ol.Coordinate} Coordinates.
 * @api stable
 */
ol.geom.Point.prototype.getCoordinates = function() {
  return !this.flatCoordinates ? [] : this.flatCoordinates.slice();
};


/**
 * @inheritDoc
 */
ol.geom.Point.prototype.computeExtent = function(extent) {
  return ol.extent.createOrUpdateFromCoordinate(this.flatCoordinates, extent);
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.Point.prototype.getType = function() {
  return ol.geom.GeometryType.POINT;
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.Point.prototype.intersectsExtent = function(extent) {
  return ol.extent.containsXY(extent,
      this.flatCoordinates[0], this.flatCoordinates[1]);
};


/**
 * Set the coordinate of the point.
 * @param {ol.Coordinate} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api stable
 */
ol.geom.Point.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(ol.geom.GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = ol.geom.flat.deflate.coordinate(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
ol.geom.Point.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
