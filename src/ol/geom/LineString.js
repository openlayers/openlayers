/**
 * @module ol/geom/LineString
 */
import {inherits} from '../index.js';
import {extend} from '../array.js';
import {closestSquaredDistanceXY} from '../extent.js';
import GeometryLayout from '../geom/GeometryLayout.js';
import GeometryType from '../geom/GeometryType.js';
import SimpleGeometry from '../geom/SimpleGeometry.js';
import _ol_geom_flat_closest_ from '../geom/flat/closest.js';
import _ol_geom_flat_deflate_ from '../geom/flat/deflate.js';
import _ol_geom_flat_inflate_ from '../geom/flat/inflate.js';
import _ol_geom_flat_interpolate_ from '../geom/flat/interpolate.js';
import _ol_geom_flat_intersectsextent_ from '../geom/flat/intersectsextent.js';
import _ol_geom_flat_length_ from '../geom/flat/length.js';
import {forEach as forEachSegment} from '../geom/flat/segments.js';
import _ol_geom_flat_simplify_ from '../geom/flat/simplify.js';

/**
 * @classdesc
 * Linestring geometry.
 *
 * @constructor
 * @extends {ol.geom.SimpleGeometry}
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
 * @api
 */
const LineString = function(coordinates, opt_layout) {

  SimpleGeometry.call(this);

  /**
   * @private
   * @type {ol.Coordinate}
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
 * @param {ol.Coordinate} coordinate Coordinate.
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
 * @return {!ol.geom.LineString} Clone.
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
    this.maxDelta_ = Math.sqrt(_ol_geom_flat_closest_.getMaxSquaredDelta(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, 0));
    this.maxDeltaRevision_ = this.getRevision();
  }
  return _ol_geom_flat_closest_.getClosestPoint(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
    this.maxDelta_, false, x, y, closestPoint, minSquaredDistance);
};


/**
 * Iterate over each segment, calling the provided callback.
 * If the callback returns a truthy value the function returns that
 * value immediately. Otherwise the function returns `false`.
 *
 * @param {function(this: S, ol.Coordinate, ol.Coordinate): T} callback Function
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
 * @return {ol.Coordinate} Coordinate.
 * @api
 */
LineString.prototype.getCoordinateAtM = function(m, opt_extrapolate) {
  if (this.layout != GeometryLayout.XYM &&
      this.layout != GeometryLayout.XYZM) {
    return null;
  }
  const extrapolate = opt_extrapolate !== undefined ? opt_extrapolate : false;
  return _ol_geom_flat_interpolate_.lineStringCoordinateAtM(this.flatCoordinates, 0,
    this.flatCoordinates.length, this.stride, m, extrapolate);
};


/**
 * Return the coordinates of the linestring.
 * @return {Array.<ol.Coordinate>} Coordinates.
 * @override
 * @api
 */
LineString.prototype.getCoordinates = function() {
  return _ol_geom_flat_inflate_.coordinates(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
};


/**
 * Return the coordinate at the provided fraction along the linestring.
 * The `fraction` is a number between 0 and 1, where 0 is the start of the
 * linestring and 1 is the end.
 * @param {number} fraction Fraction.
 * @param {ol.Coordinate=} opt_dest Optional coordinate whose values will
 *     be modified. If not provided, a new coordinate will be returned.
 * @return {ol.Coordinate} Coordinate of the interpolated point.
 * @api
 */
LineString.prototype.getCoordinateAt = function(fraction, opt_dest) {
  return _ol_geom_flat_interpolate_.lineString(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
    fraction, opt_dest);
};


/**
 * Return the length of the linestring on projected plane.
 * @return {number} Length (on projected plane).
 * @api
 */
LineString.prototype.getLength = function() {
  return _ol_geom_flat_length_.lineString(
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
  simplifiedFlatCoordinates.length = _ol_geom_flat_simplify_.douglasPeucker(
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
  return _ol_geom_flat_intersectsextent_.lineString(
    this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
    extent);
};


/**
 * Set the coordinates of the linestring.
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.geom.GeometryLayout=} opt_layout Layout.
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
    this.flatCoordinates.length = _ol_geom_flat_deflate_.coordinates(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
};


/**
 * @param {ol.geom.GeometryLayout} layout Layout.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 */
LineString.prototype.setFlatCoordinates = function(layout, flatCoordinates) {
  this.setFlatCoordinatesInternal(layout, flatCoordinates);
  this.changed();
};
export default LineString;
