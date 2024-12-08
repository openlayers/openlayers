/**
 * @module ol/geom/MultiLineString
 */
import {extend} from '../array.js';
import {closestSquaredDistanceXY} from '../extent.js';
import LineString from './LineString.js';
import SimpleGeometry from './SimpleGeometry.js';
import {arrayMaxSquaredDelta, assignClosestArrayPoint} from './flat/closest.js';
import {deflateCoordinatesArray} from './flat/deflate.js';
import {inflateCoordinatesArray} from './flat/inflate.js';
import {
  interpolatePoint,
  lineStringsCoordinateAtM,
} from './flat/interpolate.js';
import {intersectsLineStringArray} from './flat/intersectsextent.js';
import {douglasPeuckerArray} from './flat/simplify.js';

/**
 * @classdesc
 * Multi-linestring geometry.
 *
 * @api
 */
class MultiLineString extends SimpleGeometry {
  /**
   * @param {Array<Array<import("../coordinate.js").Coordinate>|LineString>|Array<number>} coordinates
   *     Coordinates or LineString geometries. (For internal use, flat coordinates in
   *     combination with `layout` and `ends` are also accepted.)
   * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
   * @param {Array<number>} [ends] Flat coordinate ends for internal use.
   */
  constructor(coordinates, layout, ends) {
    super();

    /**
     * @type {Array<number>}
     * @private
     */
    this.ends_ = [];

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

    if (Array.isArray(coordinates[0])) {
      this.setCoordinates(
        /** @type {Array<Array<import("../coordinate.js").Coordinate>>} */ (
          coordinates
        ),
        layout,
      );
    } else if (layout !== undefined && ends) {
      this.setFlatCoordinates(
        layout,
        /** @type {Array<number>} */ (coordinates),
      );
      this.ends_ = ends;
    } else {
      const lineStrings = /** @type {Array<LineString>} */ (coordinates);
      /** @type {Array<number>} */
      const flatCoordinates = [];
      const ends = [];
      for (let i = 0, ii = lineStrings.length; i < ii; ++i) {
        const lineString = lineStrings[i];
        extend(flatCoordinates, lineString.getFlatCoordinates());
        ends.push(flatCoordinates.length);
      }
      const layout =
        lineStrings.length === 0
          ? this.getLayout()
          : lineStrings[0].getLayout();
      this.setFlatCoordinates(layout, flatCoordinates);
      this.ends_ = ends;
    }
  }

  /**
   * Append the passed linestring to the multilinestring.
   * @param {LineString} lineString LineString.
   * @api
   */
  appendLineString(lineString) {
    extend(this.flatCoordinates, lineString.getFlatCoordinates().slice());
    this.ends_.push(this.flatCoordinates.length);
    this.changed();
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!MultiLineString} Clone.
   * @api
   * @override
   */
  clone() {
    const multiLineString = new MultiLineString(
      this.flatCoordinates.slice(),
      this.layout,
      this.ends_.slice(),
    );
    multiLineString.applyProperties(this);
    return multiLineString;
  }

  /**
   * @param {number} x X.
   * @param {number} y Y.
   * @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
   * @param {number} minSquaredDistance Minimum squared distance.
   * @return {number} Minimum squared distance.
   * @override
   */
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ != this.getRevision()) {
      this.maxDelta_ = Math.sqrt(
        arrayMaxSquaredDelta(
          this.flatCoordinates,
          0,
          this.ends_,
          this.stride,
          0,
        ),
      );
      this.maxDeltaRevision_ = this.getRevision();
    }
    return assignClosestArrayPoint(
      this.flatCoordinates,
      0,
      this.ends_,
      this.stride,
      this.maxDelta_,
      false,
      x,
      y,
      closestPoint,
      minSquaredDistance,
    );
  }

  /**
   * Returns the coordinate at `m` using linear interpolation, or `null` if no
   * such coordinate exists.
   *
   * `extrapolate` controls extrapolation beyond the range of Ms in the
   * MultiLineString. If `extrapolate` is `true` then Ms less than the first
   * M will return the first coordinate and Ms greater than the last M will
   * return the last coordinate.
   *
   * `interpolate` controls interpolation between consecutive LineStrings
   * within the MultiLineString. If `interpolate` is `true` the coordinates
   * will be linearly interpolated between the last coordinate of one LineString
   * and the first coordinate of the next LineString.  If `interpolate` is
   * `false` then the function will return `null` for Ms falling between
   * LineStrings.
   *
   * @param {number} m M.
   * @param {boolean} [extrapolate] Extrapolate. Default is `false`.
   * @param {boolean} [interpolate] Interpolate. Default is `false`.
   * @return {import("../coordinate.js").Coordinate|null} Coordinate.
   * @api
   */
  getCoordinateAtM(m, extrapolate, interpolate) {
    if (
      (this.layout != 'XYM' && this.layout != 'XYZM') ||
      this.flatCoordinates.length === 0
    ) {
      return null;
    }
    extrapolate = extrapolate !== undefined ? extrapolate : false;
    interpolate = interpolate !== undefined ? interpolate : false;
    return lineStringsCoordinateAtM(
      this.flatCoordinates,
      0,
      this.ends_,
      this.stride,
      m,
      extrapolate,
      interpolate,
    );
  }

  /**
   * Return the coordinates of the multilinestring.
   * @return {Array<Array<import("../coordinate.js").Coordinate>>} Coordinates.
   * @api
   * @override
   */
  getCoordinates() {
    return inflateCoordinatesArray(
      this.flatCoordinates,
      0,
      this.ends_,
      this.stride,
    );
  }

  /**
   * @return {Array<number>} Ends.
   */
  getEnds() {
    return this.ends_;
  }

  /**
   * Return the linestring at the specified index.
   * @param {number} index Index.
   * @return {LineString} LineString.
   * @api
   */
  getLineString(index) {
    if (index < 0 || this.ends_.length <= index) {
      return null;
    }
    return new LineString(
      this.flatCoordinates.slice(
        index === 0 ? 0 : this.ends_[index - 1],
        this.ends_[index],
      ),
      this.layout,
    );
  }

  /**
   * Return the linestrings of this multilinestring.
   * @return {Array<LineString>} LineStrings.
   * @api
   */
  getLineStrings() {
    const flatCoordinates = this.flatCoordinates;
    const ends = this.ends_;
    const layout = this.layout;
    /** @type {Array<LineString>} */
    const lineStrings = [];
    let offset = 0;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      const end = ends[i];
      const lineString = new LineString(
        flatCoordinates.slice(offset, end),
        layout,
      );
      lineStrings.push(lineString);
      offset = end;
    }
    return lineStrings;
  }

  /**
   * @return {Array<number>} Flat midpoints.
   */
  getFlatMidpoints() {
    /** @type {Array<number>} */
    const midpoints = [];
    const flatCoordinates = this.flatCoordinates;
    let offset = 0;
    const ends = this.ends_;
    const stride = this.stride;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      const end = ends[i];
      const midpoint = interpolatePoint(
        flatCoordinates,
        offset,
        end,
        stride,
        0.5,
      );
      extend(midpoints, midpoint);
      offset = end;
    }
    return midpoints;
  }

  /**
   * @param {number} squaredTolerance Squared tolerance.
   * @return {MultiLineString} Simplified MultiLineString.
   * @protected
   * @override
   */
  getSimplifiedGeometryInternal(squaredTolerance) {
    /** @type {Array<number>} */
    const simplifiedFlatCoordinates = [];
    /** @type {Array<number>} */
    const simplifiedEnds = [];
    simplifiedFlatCoordinates.length = douglasPeuckerArray(
      this.flatCoordinates,
      0,
      this.ends_,
      this.stride,
      squaredTolerance,
      simplifiedFlatCoordinates,
      0,
      simplifiedEnds,
    );
    return new MultiLineString(simplifiedFlatCoordinates, 'XY', simplifiedEnds);
  }

  /**
   * Get the type of this geometry.
   * @return {import("./Geometry.js").Type} Geometry type.
   * @api
   * @override
   */
  getType() {
    return 'MultiLineString';
  }

  /**
   * Test if the geometry and the passed extent intersect.
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {boolean} `true` if the geometry and the extent intersect.
   * @api
   * @override
   */
  intersectsExtent(extent) {
    return intersectsLineStringArray(
      this.flatCoordinates,
      0,
      this.ends_,
      this.stride,
      extent,
    );
  }

  /**
   * Set the coordinates of the multilinestring.
   * @param {!Array<Array<import("../coordinate.js").Coordinate>>} coordinates Coordinates.
   * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
   * @api
   * @override
   */
  setCoordinates(coordinates, layout) {
    this.setLayout(layout, coordinates, 2);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    const ends = deflateCoordinatesArray(
      this.flatCoordinates,
      0,
      coordinates,
      this.stride,
      this.ends_,
    );
    this.flatCoordinates.length = ends.length === 0 ? 0 : ends[ends.length - 1];
    this.changed();
  }
}

export default MultiLineString;
