/**
 * @module ol/geom/Polygon
 */
import LinearRing from './LinearRing.js';
import Point from './Point.js';
import SimpleGeometry from './SimpleGeometry.js';
import {arrayMaxSquaredDelta, assignClosestArrayPoint} from './flat/closest.js';
import {closestSquaredDistanceXY, getCenter, isEmpty} from '../extent.js';
import {deflateCoordinatesArray} from './flat/deflate.js';
import {extend} from '../array.js';
import {getInteriorPointOfArray} from './flat/interiorpoint.js';
import {inflateCoordinatesArray} from './flat/inflate.js';
import {intersectsLinearRingArray} from './flat/intersectsextent.js';
import {linearRingsAreOriented, orientLinearRings} from './flat/orient.js';
import {linearRings as linearRingsArea} from './flat/area.js';
import {linearRingsContainsXY} from './flat/contains.js';
import {modulo} from '../math.js';
import {quantizeArray} from './flat/simplify.js';
import {offset as sphereOffset} from '../sphere.js';

/**
 * @classdesc
 * Polygon geometry.
 *
 * @api
 */
class Polygon extends SimpleGeometry {
  /**
   * @param {!Array<Array<import("../coordinate.js").Coordinate>>|!Array<number>} coordinates
   *     Array of linear rings that define the polygon. The first linear ring of the
   *     array defines the outer-boundary or surface of the polygon. Each subsequent
   *     linear ring defines a hole in the surface of the polygon. A linear ring is
   *     an array of vertices' coordinates where the first coordinate and the last are
   *     equivalent. (For internal use, flat coordinates in combination with
   *     `layout` and `ends` are also accepted.)
   * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
   * @param {Array<number>} [ends] Ends (for internal use with flat coordinates).
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
    this.flatInteriorPointRevision_ = -1;

    /**
     * @private
     * @type {import("../coordinate.js").Coordinate|null}
     */
    this.flatInteriorPoint_ = null;

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

    /**
     * @private
     * @type {number}
     */
    this.orientedRevision_ = -1;

    /**
     * @private
     * @type {Array<number>|null}
     */
    this.orientedFlatCoordinates_ = null;

    if (layout !== undefined && ends) {
      this.setFlatCoordinates(
        layout,
        /** @type {Array<number>} */ (coordinates),
      );
      this.ends_ = ends;
    } else {
      this.setCoordinates(
        /** @type {Array<Array<import("../coordinate.js").Coordinate>>} */ (
          coordinates
        ),
        layout,
      );
    }
  }

  /**
   * Append the passed linear ring to this polygon.
   * @param {LinearRing} linearRing Linear ring.
   * @api
   */
  appendLinearRing(linearRing) {
    if (!this.flatCoordinates) {
      this.flatCoordinates = linearRing.getFlatCoordinates().slice();
    } else {
      extend(this.flatCoordinates, linearRing.getFlatCoordinates());
    }
    this.ends_.push(this.flatCoordinates.length);
    this.changed();
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!Polygon} Clone.
   * @api
   */
  clone() {
    const polygon = new Polygon(
      this.flatCoordinates.slice(),
      this.layout,
      this.ends_.slice(),
    );
    polygon.applyProperties(this);
    return polygon;
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
      true,
      x,
      y,
      closestPoint,
      minSquaredDistance,
    );
  }

  /**
   * @param {number} x X.
   * @param {number} y Y.
   * @return {boolean} Contains (x, y).
   */
  containsXY(x, y) {
    return linearRingsContainsXY(
      this.getOrientedFlatCoordinates(),
      0,
      this.ends_,
      this.stride,
      x,
      y,
    );
  }

  /**
   * Return the area of the polygon on projected plane.
   * @return {number} Area (on projected plane).
   * @api
   */
  getArea() {
    return linearRingsArea(
      this.getOrientedFlatCoordinates(),
      0,
      this.ends_,
      this.stride,
    );
  }

  /**
   * Get the coordinate array for this geometry.  This array has the structure
   * of a GeoJSON coordinate array for polygons.
   *
   * @param {boolean} [right] Orient coordinates according to the right-hand
   *     rule (counter-clockwise for exterior and clockwise for interior rings).
   *     If `false`, coordinates will be oriented according to the left-hand rule
   *     (clockwise for exterior and counter-clockwise for interior rings).
   *     By default, coordinate orientation will depend on how the geometry was
   *     constructed.
   * @return {Array<Array<import("../coordinate.js").Coordinate>>} Coordinates.
   * @api
   */
  getCoordinates(right) {
    let flatCoordinates;
    if (right !== undefined) {
      flatCoordinates = this.getOrientedFlatCoordinates().slice();
      orientLinearRings(flatCoordinates, 0, this.ends_, this.stride, right);
    } else {
      flatCoordinates = this.flatCoordinates;
    }

    return inflateCoordinatesArray(flatCoordinates, 0, this.ends_, this.stride);
  }

  /**
   * @return {Array<number>} Ends.
   */
  getEnds() {
    return this.ends_;
  }

  /**
   * @return {Array<number>} Interior point.
   */
  getFlatInteriorPoint() {
    if (this.flatInteriorPointRevision_ != this.getRevision()) {
      const flatCenter = getCenter(this.getExtent());
      this.flatInteriorPoint_ = getInteriorPointOfArray(
        this.getOrientedFlatCoordinates(),
        0,
        this.ends_,
        this.stride,
        flatCenter,
        0,
      );
      this.flatInteriorPointRevision_ = this.getRevision();
    }
    return /** @type {import("../coordinate.js").Coordinate} */ (
      this.flatInteriorPoint_
    );
  }

  /**
   * Return an interior point of the polygon.
   * @return {Point} Interior point as XYM coordinate, where M is the
   * length of the horizontal intersection that the point belongs to.
   * @api
   */
  getInteriorPoint() {
    return new Point(this.getFlatInteriorPoint(), 'XYM');
  }

  /**
   * Return the number of rings of the polygon,  this includes the exterior
   * ring and any interior rings.
   *
   * @return {number} Number of rings.
   * @api
   */
  getLinearRingCount() {
    return this.ends_.length;
  }

  /**
   * Return the Nth linear ring of the polygon geometry. Return `null` if the
   * given index is out of range.
   * The exterior linear ring is available at index `0` and the interior rings
   * at index `1` and beyond.
   *
   * @param {number} index Index.
   * @return {LinearRing|null} Linear ring.
   * @api
   */
  getLinearRing(index) {
    if (index < 0 || this.ends_.length <= index) {
      return null;
    }
    return new LinearRing(
      this.flatCoordinates.slice(
        index === 0 ? 0 : this.ends_[index - 1],
        this.ends_[index],
      ),
      this.layout,
    );
  }

  /**
   * Return the linear rings of the polygon.
   * @return {Array<LinearRing>} Linear rings.
   * @api
   */
  getLinearRings() {
    const layout = this.layout;
    const flatCoordinates = this.flatCoordinates;
    const ends = this.ends_;
    const linearRings = [];
    let offset = 0;
    for (let i = 0, ii = ends.length; i < ii; ++i) {
      const end = ends[i];
      const linearRing = new LinearRing(
        flatCoordinates.slice(offset, end),
        layout,
      );
      linearRings.push(linearRing);
      offset = end;
    }
    return linearRings;
  }

  /**
   * @return {Array<number>} Oriented flat coordinates.
   */
  getOrientedFlatCoordinates() {
    if (this.orientedRevision_ != this.getRevision()) {
      const flatCoordinates = this.flatCoordinates;
      if (linearRingsAreOriented(flatCoordinates, 0, this.ends_, this.stride)) {
        this.orientedFlatCoordinates_ = flatCoordinates;
      } else {
        this.orientedFlatCoordinates_ = flatCoordinates.slice();
        this.orientedFlatCoordinates_.length = orientLinearRings(
          this.orientedFlatCoordinates_,
          0,
          this.ends_,
          this.stride,
        );
      }
      this.orientedRevision_ = this.getRevision();
    }
    return /** @type {Array<number>} */ (this.orientedFlatCoordinates_);
  }

  /**
   * @param {number} squaredTolerance Squared tolerance.
   * @return {Polygon} Simplified Polygon.
   * @protected
   */
  getSimplifiedGeometryInternal(squaredTolerance) {
    /** @type {Array<number>} */
    const simplifiedFlatCoordinates = [];
    /** @type {Array<number>} */
    const simplifiedEnds = [];
    simplifiedFlatCoordinates.length = quantizeArray(
      this.flatCoordinates,
      0,
      this.ends_,
      this.stride,
      Math.sqrt(squaredTolerance),
      simplifiedFlatCoordinates,
      0,
      simplifiedEnds,
    );
    return new Polygon(simplifiedFlatCoordinates, 'XY', simplifiedEnds);
  }

  /**
   * Get the type of this geometry.
   * @return {import("./Geometry.js").Type} Geometry type.
   * @api
   */
  getType() {
    return 'Polygon';
  }

  /**
   * Test if the geometry and the passed extent intersect.
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {boolean} `true` if the geometry and the extent intersect.
   * @api
   */
  intersectsExtent(extent) {
    return intersectsLinearRingArray(
      this.getOrientedFlatCoordinates(),
      0,
      this.ends_,
      this.stride,
      extent,
    );
  }

  /**
   * Set the coordinates of the polygon.
   * @param {!Array<Array<import("../coordinate.js").Coordinate>>} coordinates Coordinates.
   * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
   * @api
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

export default Polygon;

/**
 * Create an approximation of a circle on the surface of a sphere.
 * @param {import("../coordinate.js").Coordinate} center Center (`[lon, lat]` in degrees).
 * @param {number} radius The great-circle distance from the center to
 *     the polygon vertices in meters.
 * @param {number} [n] Optional number of vertices for the resulting
 *     polygon. Default is `32`.
 * @param {number} [sphereRadius] Optional radius for the sphere (defaults to
 *     the Earth's mean radius using the WGS84 ellipsoid).
 * @return {Polygon} The "circular" polygon.
 * @api
 */
export function circular(center, radius, n, sphereRadius) {
  n = n ? n : 32;
  /** @type {Array<number>} */
  const flatCoordinates = [];
  for (let i = 0; i < n; ++i) {
    extend(
      flatCoordinates,
      sphereOffset(center, radius, (2 * Math.PI * i) / n, sphereRadius),
    );
  }
  flatCoordinates.push(flatCoordinates[0], flatCoordinates[1]);
  return new Polygon(flatCoordinates, 'XY', [flatCoordinates.length]);
}

/**
 * Create a polygon from an extent. The layout used is `XY`.
 * @param {import("../extent.js").Extent} extent The extent.
 * @return {Polygon} The polygon.
 * @api
 */
export function fromExtent(extent) {
  if (isEmpty(extent)) {
    throw new Error('Cannot create polygon from empty extent');
  }
  const minX = extent[0];
  const minY = extent[1];
  const maxX = extent[2];
  const maxY = extent[3];
  const flatCoordinates = [
    minX,
    minY,
    minX,
    maxY,
    maxX,
    maxY,
    maxX,
    minY,
    minX,
    minY,
  ];
  return new Polygon(flatCoordinates, 'XY', [flatCoordinates.length]);
}

/**
 * Create a regular polygon from a circle.
 * @param {import("./Circle.js").default} circle Circle geometry.
 * @param {number} [sides] Number of sides of the polygon. Default is 32.
 * @param {number} [angle] Start angle for the first vertex of the polygon in
 *     counter-clockwise radians. 0 means East. Default is 0.
 * @return {Polygon} Polygon geometry.
 * @api
 */
export function fromCircle(circle, sides, angle) {
  sides = sides ? sides : 32;
  const stride = circle.getStride();
  const layout = circle.getLayout();
  const center = circle.getCenter();
  const arrayLength = stride * (sides + 1);
  const flatCoordinates = new Array(arrayLength);
  for (let i = 0; i < arrayLength; i += stride) {
    flatCoordinates[i] = 0;
    flatCoordinates[i + 1] = 0;
    for (let j = 2; j < stride; j++) {
      flatCoordinates[i + j] = center[j];
    }
  }
  const ends = [flatCoordinates.length];
  const polygon = new Polygon(flatCoordinates, layout, ends);
  makeRegular(polygon, center, circle.getRadius(), angle);
  return polygon;
}

/**
 * Modify the coordinates of a polygon to make it a regular polygon.
 * @param {Polygon} polygon Polygon geometry.
 * @param {import("../coordinate.js").Coordinate} center Center of the regular polygon.
 * @param {number} radius Radius of the regular polygon.
 * @param {number} [angle] Start angle for the first vertex of the polygon in
 *     counter-clockwise radians. 0 means East. Default is 0.
 */
export function makeRegular(polygon, center, radius, angle) {
  const flatCoordinates = polygon.getFlatCoordinates();
  const stride = polygon.getStride();
  const sides = flatCoordinates.length / stride - 1;
  const startAngle = angle ? angle : 0;
  for (let i = 0; i <= sides; ++i) {
    const offset = i * stride;
    const angle = startAngle + (modulo(i, sides) * 2 * Math.PI) / sides;
    flatCoordinates[offset] = center[0] + radius * Math.cos(angle);
    flatCoordinates[offset + 1] = center[1] + radius * Math.sin(angle);
  }
  polygon.changed();
}
