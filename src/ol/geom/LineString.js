/**
 * @module ol/geom/LineString
 */
import {extend} from '../array.js';
import {closestSquaredDistanceXY} from '../extent.js';
import GeometryLayout from './GeometryLayout.js';
import GeometryType from './GeometryType.js';
import SimpleGeometry from './SimpleGeometry.js';
import {assignClosestPoint, maxSquaredDelta} from './flat/closest.js';
import {deflateCoordinates} from './flat/deflate.js';
import {inflateCoordinates} from './flat/inflate.js';
import {interpolatePoint, lineStringCoordinateAtM} from './flat/interpolate.js';
import {intersectsLineString} from './flat/intersectsextent.js';
import {lineStringLength} from './flat/length.js';
import {forEach as forEachSegment} from './flat/segments.js';
import {douglasPeucker} from './flat/simplify.js';

/**
 * @classdesc
 * Linestring geometry.
 *
 * @api
 */
class LineString extends SimpleGeometry {

  /**
   * @param {Array<import("../coordinate.js").Coordinate>|Array<number>} coordinates Coordinates.
   *     For internal use, flat coordinates in combination with `opt_layout` are also accepted.
   * @param {GeometryLayout=} opt_layout Layout.
   */
  constructor(coordinates, opt_layout) {

    super();

    /**
     * @private
     * @type {import("../coordinate.js").Coordinate}
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

    if (opt_layout !== undefined && !Array.isArray(coordinates[0])) {
      this.setFlatCoordinates(opt_layout, /** @type {Array<number>} */ (coordinates));
    } else {
      this.setCoordinates(/** @type {Array<import("../coordinate.js").Coordinate>} */ (coordinates), opt_layout);
    }

  }

  /**
   * Append the passed coordinate to the coordinates of the linestring.
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @api
   */
  appendCoordinate(coordinate) {
    if (!this.flatCoordinates) {
      this.flatCoordinates = coordinate.slice();
    } else {
      extend(this.flatCoordinates, coordinate);
    }
    this.changed();
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!LineString} Clone.
   * @override
   * @api
   */
  clone() {
    return new LineString(this.flatCoordinates.slice(), this.layout);
  }

  /**
   * @inheritDoc
   */
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
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
  }

  /**
   * Iterate over each segment, calling the provided callback.
   * If the callback returns a truthy value the function returns that
   * value immediately. Otherwise the function returns `false`.
   *
   * @param {function(this: S, import("../coordinate.js").Coordinate, import("../coordinate.js").Coordinate): T} callback Function
   *     called for each segment.
   * @return {T|boolean} Value.
   * @template T,S
   * @api
   */
  forEachSegment(callback) {
    return forEachSegment(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, callback);
  }

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
   * @return {import("../coordinate.js").Coordinate} Coordinate.
   * @api
   */
  getCoordinateAtM(m, opt_extrapolate) {
    if (this.layout != GeometryLayout.XYM &&
        this.layout != GeometryLayout.XYZM) {
      return null;
    }
    const extrapolate = opt_extrapolate !== undefined ? opt_extrapolate : false;
    return lineStringCoordinateAtM(this.flatCoordinates, 0,
      this.flatCoordinates.length, this.stride, m, extrapolate);
  }

  /**
   * Return the coordinates of the linestring.
   * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
   * @override
   * @api
   */
  getCoordinates() {
    return inflateCoordinates(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
  }

  /**
   * Return the coordinate at the provided fraction along the linestring.
   * The `fraction` is a number between 0 and 1, where 0 is the start of the
   * linestring and 1 is the end.
   * @param {number} fraction Fraction.
   * @param {import("../coordinate.js").Coordinate=} opt_dest Optional coordinate whose values will
   *     be modified. If not provided, a new coordinate will be returned.
   * @return {import("../coordinate.js").Coordinate} Coordinate of the interpolated point.
   * @api
   */
  getCoordinateAt(fraction, opt_dest) {
    return interpolatePoint(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      fraction, opt_dest);
  }

  /**
   * Return the length of the linestring on projected plane.
   * @return {number} Length (on projected plane).
   * @api
   */
  getLength() {
    return lineStringLength(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
  }

  /**
   * @return {Array<number>} Flat midpoint.
   */
  getFlatMidpoint() {
    if (this.flatMidpointRevision_ != this.getRevision()) {
      this.flatMidpoint_ = this.getCoordinateAt(0.5, this.flatMidpoint_);
      this.flatMidpointRevision_ = this.getRevision();
    }
    return this.flatMidpoint_;
  }

  /**
   * @inheritDoc
   */
  getSimplifiedGeometryInternal(squaredTolerance) {
    const simplifiedFlatCoordinates = [];
    simplifiedFlatCoordinates.length = douglasPeucker(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      squaredTolerance, simplifiedFlatCoordinates, 0);
    return new LineString(simplifiedFlatCoordinates, GeometryLayout.XY);
  }

  /**
   * @inheritDoc
   * @api
   */
  getType() {
    return GeometryType.LINE_STRING;
  }

  /**
   * @inheritDoc
   * @api
   */
  intersectsExtent(extent) {
    return intersectsLineString(
      this.flatCoordinates, 0, this.flatCoordinates.length, this.stride,
      extent);
  }

  /**
   * Set the coordinates of the linestring.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {GeometryLayout=} opt_layout Layout.
   * @override
   * @api
   */
  setCoordinates(coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = deflateCoordinates(
      this.flatCoordinates, 0, coordinates, this.stride);
    this.changed();
  }
}


export default LineString;
