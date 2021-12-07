/**
 * @module ol/geom/CircularString
 */
import GeometryType from './GeometryType.js';
import SimpleGeometry from './SimpleGeometry.js';
import {assignClosestPoint, maxSquaredDelta} from './flat/closest.js';
import {
  closestSquaredDistanceXY,
  createEmpty,
  extendFlatCoordinates,
  intersects,
} from '../extent.js';
import {deflateCoordinates} from './flat/deflate.js';
import {inflateCoordinates} from './flat/inflate.js';

/**
 * @classdesc
 * CircularString geometry.
 *
 * @api
 */
class CircularString extends SimpleGeometry {
  /**
   * @param {Array<import("../coordinate.js").Coordinate>|Array<number>} coordinates Coordinates.
   *     For internal use, flat coordinates in combination with `opt_layout` are also accepted.
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   */
  constructor(coordinates, opt_layout) {
    super();

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
      this.setFlatCoordinates(
        opt_layout,
        /** @type {Array<number>} */ (coordinates)
      );
    } else {
      this.setCoordinates(
        /** @type {Array<import("../coordinate.js").Coordinate>} */ (
          coordinates
        ),
        opt_layout
      );
    }
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!CircularString} Clone.
   * @api
   */
  clone() {
    const circularString = new CircularString(
      this.flatCoordinates.slice(),
      this.layout
    );
    circularString.applyProperties(this);
    return circularString;
  }

  /**
   * @param {number} x X.
   * @param {number} y Y.
   * @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
   * @param {number} minSquaredDistance Minimum squared distance.
   * @return {number} Minimum squared distance.
   */
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    if (this.maxDeltaRevision_ !== this.getRevision()) {
      this.maxDelta_ = Math.sqrt(
        maxSquaredDelta(
          this.flatCoordinates,
          0,
          this.flatCoordinates.length,
          this.stride,
          0
        )
      );
      this.maxDeltaRevision_ = this.getRevision();
    }
    return assignClosestPoint(
      this.flatCoordinates,
      0,
      this.flatCoordinates.length,
      this.stride,
      this.maxDelta_,
      false,
      x,
      y,
      closestPoint,
      minSquaredDistance
    );
  }

  /**
   * Return the coordinates of the circular string.
   * @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
   * @api
   */
  getCoordinates() {
    return inflateCoordinates(
      this.flatCoordinates,
      0,
      this.flatCoordinates.length,
      this.stride
    );
  }

  /**
   * Get the type of this geometry.
   * @return {import("./GeometryType.js").default} Geometry type.
   * @api
   */
  getType() {
    return GeometryType.CIRCULAR_STRING;
  }

  /**
   * Test if the geometry and the passed extent intersect.
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {boolean} `true` if the geometry and the extent intersect.
   * @api
   */
  intersectsExtent(extent) {
    // test per arc extents
    for (let i = 0; i < this.flatCoordinates.length - 2; i += 4) {
      const arcExtents = extendFlatCoordinates(
        createEmpty(),
        this.flatCoordinates,
        i,
        i + this.stride * 3,
        this.stride
      );
      if (intersects(extent, arcExtents)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Set the coordinates of the circular string.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   * @api
   */
  setCoordinates(coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 1);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = deflateCoordinates(
      this.flatCoordinates,
      0,
      coordinates,
      this.stride
    );
    this.changed();
  }
}

export default CircularString;
