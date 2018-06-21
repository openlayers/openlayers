/**
 * @module ol/geom/MultiPoint
 */
import {inherits} from '../util.js';
import {extend} from '../array.js';
import {closestSquaredDistanceXY, containsXY} from '../extent.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import Point from '../geom/Point.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import {deflateCoordinates} from '../geom/flat/deflate.js';
import {inflateCoordinates} from '../geom/flat/inflate.js';
import {squaredDistance as squaredDx} from '../math.js';

/**
 * @classdesc
 * Multi-point geometry.
 *
 * @constructor
 * @extends {module:ol/geom/SimpleGeometry}
 * @param {Array.<module:ol/coordinate~Coordinate>} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @api
 */
const MultiPoint = function(coordinates, opt_layout) {
  SimpleGeometry.call(this);
  this.setCoordinates(coordinates, opt_layout);
};

inherits(MultiPoint, SimpleGeometry);


/**
 * Append the passed point to this multipoint.
 * @param {module:ol/geom/Point} point Point.
 * @api
 */
MultiPoint.prototype.appendPoint = function(point) {
  if (!this.flatCoordinates) {
    this.flatCoordinates = point.getFlatCoordinates().slice();
  } else {
    extend(this.flatCoordinates, point.getFlatCoordinates());
  }
  this.changed();
};


/**
 * Make a complete copy of the geometry.
 * @return {!module:ol/geom/MultiPoint} Clone.
 * @override
 * @api
 */
MultiPoint.prototype.clone = function() {
  const multiPoint = new MultiPoint(null);
  multiPoint.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return multiPoint;
};


/**
 * @inheritDoc
 */
MultiPoint.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  const flatCoordinates = this.flatCoordinates;
  const stride = this.stride;
  for (let i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    const squaredDistance = squaredDx(
      x, y, flatCoordinates[i], flatCoordinates[i + 1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      for (let j = 0; j < stride; ++j) {
        closestPoint[j] = flatCoordinates[i + j];
      }
      closestPoint.length = stride;
    }
  }
  return minSquaredDistance;
};


/**
 * Return the coordinates of the multipoint.
 * @return {Array.<module:ol/coordinate~Coordinate>} Coordinates.
 * @override
 * @api
 */
MultiPoint.prototype.getCoordinates = function() {
  return inflateCoordinates(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * Return the point at the specified index.
 * @param {number} index Index.
 * @return {module:ol/geom/Point} Point.
 * @api
 */
MultiPoint.prototype.getPoint = function(index) {
  const n = !this.flatCoordinates ? 0 : this.flatCoordinates.length / this.stride;
  if (index < 0 || n <= index) {
    return null;
  }
  const point = new Point(null);
  point.setFlatCoordinates(this.layout, this.flatCoordinates.slice(
    index * this.stride, (index + 1) * this.stride));
  return point;
};


/**
 * Return the points of this multipoint.
 * @return {Array.<module:ol/geom/Point>} Points.
 * @api
 */
MultiPoint.prototype.getPoints = function() {
  const flatCoordinates = this.flatCoordinates;
  const layout = this.layout;
  const stride = this.stride;
  /** @type {Array.<module:ol/geom/Point>} */
  const points = [];
  for (let i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    const point = new Point(null);
    point.setFlatCoordinates(layout, flatCoordinates.slice(i, i + stride));
    points.push(point);
  }
  return points;
};


/**
 * @inheritDoc
 * @api
 */
MultiPoint.prototype.getType = function() {
  return GeometryType.MULTI_POINT;
};


/**
 * @inheritDoc
 * @api
 */
MultiPoint.prototype.intersectsExtent = function(extent) {
  const flatCoordinates = this.flatCoordinates;
  const stride = this.stride;
  for (let i = 0, ii = flatCoordinates.length; i < ii; i += stride) {
    const x = flatCoordinates[i];
    const y = flatCoordinates[i + 1];
    if (containsXY(extent, x, y)) {
      return true;
    }
  }
  return false;
};


/**
 * Set the coordinates of the multipoint.
 * @param {Array.<module:ol/coordinate~Coordinate>} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
MultiPoint.prototype.setCoordinates = function(coordinates, opt_layout) {
  if (!coordinates) {
    this.setFlatCoordinates(GeometryLayout.XY, null);
  } else {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = deflateCoordinates(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {module:ol/geom/GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
MultiPoint.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default MultiPoint;
