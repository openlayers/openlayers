/**
 * @module ol/geom/LinearRing
 */
import {inherits} from '../util.js';
import {closestSquaredDistanceXY} from '../extent.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import {linearRing as linearRingArea} from '../geom/flat/area.js';
import {assignClosestPoint, maxSquaredDelta} from '../geom/flat/closest.js';
import {deflateCoordinates} from '../geom/flat/deflate.js';
import {inflateCoordinates} from '../geom/flat/inflate.js';
import {douglasPeucker} from '../geom/flat/simplify.js';

/**
 * @classdesc
 * Linear ring geometry. Only used as part of polygon; cannot be rendered
 * on its own.
 *
 * @constructor
 * @extends {module:ol/geom/SimpleGeometry}
 * @param {Array.<module:ol/coordinate~Coordinate>} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @api
 */
const LinearRing = function(coordinates, opt_layout) {

  SimpleGeometry.call(this);

  /**
   * @private
   * @type {number}
   */
  this.maxDelta_ = -1;

  /**
   * @private
   * @type {number}
   */
  this.maxDeltaRevision_ = -1;

  this.setCoordinates(coordinates, opt_layout);

};

inherits(LinearRing, SimpleGeometry);


/**
 * Make a complete copy of the geometry.
 * @return {!module:ol/geom/LinearRing} Clone.
 * @override
 * @api
 */
LinearRing.prototype.clone = function() {
  const linearRing = new LinearRing(null);
  linearRing.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return linearRing;
};


/**
 * @inheritDoc
 */
LinearRing.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  if (this.maxDeltaRevision_ != this.getRevision()) {
    this.maxDelta_ = Math.sqrt(maxSquaredDelta(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, 0));
    this.maxDeltaRevision_ = this.getRevision();
  }
  return assignClosestPoint(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
    this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
};


/**
 * Return the area of the linear ring on projected plane.
 * @return {number} Area (on projected plane).
 * @api
 */
LinearRing.prototype.getArea = function() {
  return linearRingArea(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * Return the coordinates of the linear ring.
 * @return {Array.<module:ol/coordinate~Coordinate>} Coordinates.
 * @override
 * @api
 */
LinearRing.prototype.getCoordinates = function() {
  return inflateCoordinates(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @inheritDoc
 */
LinearRing.prototype.getSimplifiedGeometryInternal = function(squaredTolerance) {
  const simplifiedFlatCoordinates = [];
  simplifiedFlatCoordinates.length = douglasPeucker(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
    squaredTolerance, simplifiedFlatCoordinates, 0);
  const simplifiedLinearRing = new LinearRing(null);
  simplifiedLinearRing.setFlatCoordinates(
    GeometryLayout.XY, simplifiedFlatCoordinates);
  return simplifiedLinearRing;
};


/**
 * @inheritDoc
 * @api
 */
LinearRing.prototype.getType = function() {
  return GeometryType.LINEAR_RING;
};


/**
 * @inheritDoc
 */
LinearRing.prototype.intersectsExtent = function(extent) {};


/**
 * Set the coordinates of the linear ring.
 * @param {Array.<module:ol/coordinate~Coordinate>} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
LinearRing.prototype.setCoordinates = function(coordinates, opt_layout) {
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
LinearRing.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default LinearRing;
