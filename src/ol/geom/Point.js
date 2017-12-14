/**
 * @module ol/geom/Point
 */
import {inherits} from '../index.js';
import {createOrUpdateFromCoordinate, containsXY} from '../extent.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import _ol_geom_GeometryType_ from '../geom/GeometryType.js';
import _ol_geom_SimpleGeometry_ from '../geom/SimpleGeometry.js';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate.js';
import _ol_math_ from '../math.js';

/**
 * @classdesc
 * Point geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {ol.Coordinate} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
var Point = function(coordinates, opt_layout) {
  _ol_geom_SimpleGeometry_.call(this);
  this.setCoordinates(coordinates, opt_layout);
};

inherits(Point, _ol_geom_SimpleGeometry_);


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.Point} Clone.
 * @override
 * @api
 */
Point.prototype.clone = function() {
  var point = new Point(null);
  point.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return point;
};


/**
 * @inheritDoc
 */
Point.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  var flatCoordinates = this.flatCoordinates;
  var squaredDistance = _ol_math_.squaredDistance(
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
 * @override
 * @api
 */
Point.prototype.getCoordinates = function() {
  return !this.flatCoordinates ? [] : this.flatCoordinates.slice();
};


/**
 * @inheritDoc
 */
Point.prototype.computeExtent = function(extent) {
  return createOrUpdateFromCoordinate(this.flatCoordinates, extent);
};


/**
 * @inheritDoc
 * @api
 */
Point.prototype.getType = function() {
  return _ol_geom_GeometryType_.POINT;
};


/**
 * @inheritDoc
 * @api
 */
Point.prototype.intersectsExtent = function(extent) {
  return containsXY(extent, this.flatCoordinates[0], this.flatCoordinates[1]);
};


/**
 * @inheritDoc
 * @api
 */
Point.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = _ol_geom_flat_deflate_.coordinate(
        this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
Point.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default Point;
