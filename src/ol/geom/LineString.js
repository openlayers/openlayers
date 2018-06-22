/**
 * @module ol/geom/LineString
 */
import {inherits} from '../util.js';
import {extend} from '../array.js';
import {closestSquaredDistanceXY} from '../extent.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import {assignClosestPoint, maxSquaredDelta} from '../geom/flat/closest.js';
import {deflateCoordinates} from '../geom/flat/deflate.js';
import {inflateCoordinates} from '../geom/flat/inflate.js';
import {interpolatePoint, lineStringCoordinateAtM} from '../geom/flat/interpolate.js';
import {intersectsLineString} from '../geom/flat/intersectsextent.js';
import {lineStringLength} from '../geom/flat/length.js';
import {forEach as forEachSegment} from '../geom/flat/segments.js';
import {douglasPeucker} from '../geom/flat/simplify.js';

/**
 * @classdesc
 * Linestring geometry.
 *
 * @constructor
 * @extends {module:ol/geom/SimpleGeometry}
 * @param {Array.<module:ol/coordinate~Coordinate>} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @api
 */
const LineString = function(coordinates, opt_layout) {

  SimpleGeometry.call(this);

  /**
   * @private
   * @type {module:ol/coordinate~Coordinate}
   */
  this.flatMidpoint_ = null;

  /**
   * @private
   * @type {number}
   */
  this.flatMidpointRevision_ = -1;

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

inherits(LineString, SimpleGeometry);


/**
 * Append the passed coordinate to the coordinates of the linestring.
 * @param {module:ol/coordinate~Coordinate} coordinate Coordinate.
 * @api
 */
LineString.prototype.appendCoordinate = function(coordinate) {
  if (!this.flatCoordinates) {
    this.flatCoordinates = coordinate.slice();
  } else {
    extend(this.flatCoordinates, coordinate);
  }
  this.changed();
};


/**
 * Make a complete copy of the geometry.
 * @return {!module:ol/geom/LineString} Clone.
 * @override
 * @api
 */
LineString.prototype.clone = function() {
  const lineString = new LineString(null);
  lineString.setFlatCoordinates(this.layout, this.flatCoordinates.slice());
  return lineString;
};


/**
 * @inheritDoc
 */
LineString.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
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
    this.maxDelta_, false, x, y, closestPoint, minSquaredDistance);
};


/**
 * Iterate over each segment, calling the provided callback.
 * If the callback returns a truthy value the function returns that
 * value immediately. Otherwise the function returns `false`.
 *
 * @param {function(this: S, module:ol/coordinate~Coordinate, module:ol/coordinate~Coordinate): T} callback Function
 *     called for each segment.
 * @return {T|boolean} Value.
 * @template T,S
 * @api
 */
LineString.prototype.forEachSegment = function(callback) {
  return forEachSegment(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, callback);
};


/**
 * Returns the coordinate at `m` using linear interpolation, or `null` if no
 * such coordinate exists.
 *
 * `opt_extrapolate` controls extrapolation beyond the range of Ms in the
 * MultiLineString. If `opt_extrapolate` is `true` then Ms less than the first
 * M will return the first coordinate and Ms greater than the last M will
 * return the last coordinate.
 *
 * @param {number} m M.
 * @param {boolean=} opt_extrapolate Extrapolate. Default is `false`.
 * @return {module:ol/coordinate~Coordinate} Coordinate.
 * @api
 */
LineString.prototype.getCoordinateAtM = function(m, opt_extrapolate) {
  if (this.layout != GeometryLayout.XYM &&
      this.layout != GeometryLayout.XYZM) {
    return null;
  }
  const extrapolate = opt_extrapolate !== undefined ? opt_extrapolate : false;
  return lineStringCoordinateAtM(this.flatCoordinates, 0,
    this.flatCoordinates.length, this.stride, m, extrapolate);
};


/**
 * Return the coordinates of the linestring.
 * @return {Array.<module:ol/coordinate~Coordinate>} Coordinates.
 * @override
 * @api
 */
LineString.prototype.getCoordinates = function() {
  return inflateCoordinates(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * Return the coordinate at the provided fraction along the linestring.
 * The `fraction` is a number between 0 and 1, where 0 is the start of the
 * linestring and 1 is the end.
 * @param {number} fraction Fraction.
 * @param {module:ol/coordinate~Coordinate=} opt_dest Optional coordinate whose values will
 *     be modified. If not provided, a new coordinate will be returned.
 * @return {module:ol/coordinate~Coordinate} Coordinate of the interpolated point.
 * @api
 */
LineString.prototype.getCoordinateAt = function(fraction, opt_dest) {
  return interpolatePoint(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
    fraction, opt_dest);
};


/**
 * Return the length of the linestring on projected plane.
 * @return {number} Length (on projected plane).
 * @api
 */
LineString.prototype.getLength = function() {
  return lineStringLength(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * @return {Array.<number>} Flat midpoint.
 */
LineString.prototype.getFlatMidpoint = function() {
  if (this.flatMidpointRevision_ != this.getRevision()) {
    this.flatMidpoint_ = this.getCoordinateAt(0.5, this.flatMidpoint_);
    this.flatMidpointRevision_ = this.getRevision();
  }
  return this.flatMidpoint_;
};


/**
 * @inheritDoc
 */
LineString.prototype.getSimplifiedGeometryInternal = function(squaredTolerance) {
  const simplifiedFlatCoordinates = [];
  simplifiedFlatCoordinates.length = douglasPeucker(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
    squaredTolerance, simplifiedFlatCoordinates, 0);
  const simplifiedLineString = new LineString(null);
  simplifiedLineString.setFlatCoordinates(
    GeometryLayout.XY, simplifiedFlatCoordinates);
  return simplifiedLineString;
};


/**
 * @inheritDoc
 * @api
 */
LineString.prototype.getType = function() {
  return GeometryType.LINE_STRING;
};


/**
 * @inheritDoc
 * @api
 */
LineString.prototype.intersectsExtent = function(extent) {
  return intersectsLineString(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
    extent);
};


/**
 * Set the coordinates of the linestring.
 * @param {Array.<module:ol/coordinate~Coordinate>} coordinates Coordinates.
 * @param {module:ol/geom/GeometryLayout=} opt_layout Layout.
 * @override
 * @api
 */
LineString.prototype.setCoordinates = function(coordinates, opt_layout) {
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
LineString.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default LineString;
