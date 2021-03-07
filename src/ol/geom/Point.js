/**
 * @module ol/geom/Point
 */
import GeometryType from './GeometryType.js';
import SimpleGeometry from './SimpleGeometry.js';
import {containsXY, createOrUpdateFromCoordinate} from '../extent.js';
import {deflateCoordinate} from './flat/deflate.js';
import {squaredDistance as squaredDx} from '../math.js';

/**
 * @classdesc
 * Point geometry.
 *
 * @api
 */
class Point extends SimpleGeometry {
  /**
   * @param {import("../coordinate.js").Coordinate} coordinates Coordinates.
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   */
  constructor(coordinates, opt_layout) {
    super();
    this.setCoordinates(coordinates, opt_layout);
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!Point} Clone.
   * @api
   */
  clone() {
    const point = new Point(this.flatCoordinates.slice(), this.layout);
    point.applyProperties(this);
    return point;
  }

  /**
   * @param {number} x X.
   * @param {number} y Y.
   * @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
   * @param {number} minSquaredDistance Minimum squared distance.
   * @return {number} Minimum squared distance.
   */
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    const flatCoordinates = this.flatCoordinates;
    const squaredDistance = squaredDx(
      x,
      y,
      flatCoordinates[0],
      flatCoordinates[1]
    );
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
  }

  /**
   * Return the coordinate of the point.
   * @return {import("../coordinate.js").Coordinate} Coordinates.
   * @api
   */
  getCoordinates() {
    return !this.flatCoordinates ? [] : this.flatCoordinates.slice();
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @protected
   * @return {import("../extent.js").Extent} extent Extent.
   */
  computeExtent(extent) {
    return createOrUpdateFromCoordinate(this.flatCoordinates, extent);
  }

  /**
   * Get the type of this geometry.
   * @return {import("./GeometryType.js").default} Geometry type.
   * @api
   */
  getType() {
    return GeometryType.POINT;
  }

  /**
   * Test if the geometry and the passed extent intersect.
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {boolean} `true` if the geometry and the extent intersect.
   * @api
   */
  intersectsExtent(extent) {
    return containsXY(extent, this.flatCoordinates[0], this.flatCoordinates[1]);
  }

  /**
   * @param {!Array<*>} coordinates Coordinates.
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   * @api
   */
  setCoordinates(coordinates, opt_layout) {
    this.setLayout(opt_layout, coordinates, 0);
    if (!this.flatCoordinates) {
      this.flatCoordinates = [];
    }
    this.flatCoordinates.length = deflateCoordinate(
      this.flatCoordinates,
      0,
      coordinates,
      this.stride
    );
    this.changed();
  }
}

export default Point;
