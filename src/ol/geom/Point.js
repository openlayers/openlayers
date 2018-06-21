/**
 * @module ol/geom/Point
 */
import {inherits} from '../util.js';
import {createOrUpdateFromCoordinate, containsXY} from '../extent.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import {deflateCoordinate} from '../geom/flat/deflate.js';
import {squaredDistance as squaredDx} from '../math.js';

/**
 * @classdesc
 * Point geometry.
 *
 * @constructor
 * @extends {module:ol/geom/SimpleGeometry}
 * @param {module:ol/coordinate~Coordinate} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @api
 */
const Point = function(coordinates, opt_layout) {
  SimpleGeometry.call(this);
  this.setCoordinates(coordinates, opt_layout);
};

inherits(Point, SimpleGeometry);


/**
 * Make a complete copy of the geometry.
 * @return {!module:ol/geom/Point} Clone.
 * @override
 * @api
 */
Point.prototype.clone = function() {
  const point = new Point(null);
  point.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return point;
};


/**
 * @inheritDoc
 */
Point.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  const flatCoordinates = this.flatCoordinates;
  const squaredDistance = squaredDx(x, y, flatCoordinates[0], flatCoordinates[1]);
  if (squaredDistance < minSquaredDistance) {
    const stride = this.stride;
    for (let i = 0; i < stride; ++i) {
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
 * @return {module:ol/coordinate~Coordinate} Coordinates.
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
  return GeometryType.POINT;
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
    this.flatCoordinates.length = deflateCoordinate(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {module:ol/geom/GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
Point.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default Point;
