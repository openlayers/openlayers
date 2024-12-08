/**
 * @module ol/geom/SimpleGeometry
 */
import {createOrUpdateFromFlatCoordinates, getCenter} from '../extent.js';
import {abstract} from '../util.js';
import Geometry from './Geometry.js';
import {rotate, scale, transform2D, translate} from './flat/transform.js';

/**
 * @classdesc
 * Abstract base class; only used for creating subclasses; do not instantiate
 * in apps, as cannot be rendered.
 *
 * @abstract
 * @api
 */
class SimpleGeometry extends Geometry {
  constructor() {
    super();

    /**
     * @protected
     * @type {import("./Geometry.js").GeometryLayout}
     */
    this.layout = 'XY';

    /**
     * @protected
     * @type {number}
     */
    this.stride = 2;

    /**
     * @protected
     * @type {Array<number>}
     */
    this.flatCoordinates;
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @protected
   * @return {import("../extent.js").Extent} extent Extent.
   * @override
   */
  computeExtent(extent) {
    return createOrUpdateFromFlatCoordinates(
      this.flatCoordinates,
      0,
      this.flatCoordinates.length,
      this.stride,
      extent,
    );
  }

  /**
   * @abstract
   * @return {Array<*> | null} Coordinates.
   */
  getCoordinates() {
    return abstract();
  }

  /**
   * Return the first coordinate of the geometry.
   * @return {import("../coordinate.js").Coordinate} First coordinate.
   * @api
   */
  getFirstCoordinate() {
    return this.flatCoordinates.slice(0, this.stride);
  }

  /**
   * @return {Array<number>} Flat coordinates.
   */
  getFlatCoordinates() {
    return this.flatCoordinates;
  }

  /**
   * Return the last coordinate of the geometry.
   * @return {import("../coordinate.js").Coordinate} Last point.
   * @api
   */
  getLastCoordinate() {
    return this.flatCoordinates.slice(
      this.flatCoordinates.length - this.stride,
    );
  }

  /**
   * Return the {@link import("./Geometry.js").GeometryLayout layout} of the geometry.
   * @return {import("./Geometry.js").GeometryLayout} Layout.
   * @api
   */
  getLayout() {
    return this.layout;
  }

  /**
   * Create a simplified version of this geometry using the Douglas Peucker algorithm.
   * @param {number} squaredTolerance Squared tolerance.
   * @return {SimpleGeometry} Simplified geometry.
   * @override
   */
  getSimplifiedGeometry(squaredTolerance) {
    if (this.simplifiedGeometryRevision !== this.getRevision()) {
      this.simplifiedGeometryMaxMinSquaredTolerance = 0;
      this.simplifiedGeometryRevision = this.getRevision();
    }
    // If squaredTolerance is negative or if we know that simplification will not
    // have any effect then just return this.
    if (
      squaredTolerance < 0 ||
      (this.simplifiedGeometryMaxMinSquaredTolerance !== 0 &&
        squaredTolerance <= this.simplifiedGeometryMaxMinSquaredTolerance)
    ) {
      return this;
    }

    const simplifiedGeometry =
      this.getSimplifiedGeometryInternal(squaredTolerance);
    const simplifiedFlatCoordinates = simplifiedGeometry.getFlatCoordinates();
    if (simplifiedFlatCoordinates.length < this.flatCoordinates.length) {
      return simplifiedGeometry;
    }
    // Simplification did not actually remove any coordinates.  We now know
    // that any calls to getSimplifiedGeometry with a squaredTolerance less
    // than or equal to the current squaredTolerance will also not have any
    // effect.  This allows us to short circuit simplification (saving CPU
    // cycles) and prevents the cache of simplified geometries from filling
    // up with useless identical copies of this geometry (saving memory).
    this.simplifiedGeometryMaxMinSquaredTolerance = squaredTolerance;
    return this;
  }

  /**
   * @param {number} squaredTolerance Squared tolerance.
   * @return {SimpleGeometry} Simplified geometry.
   * @protected
   */
  getSimplifiedGeometryInternal(squaredTolerance) {
    return this;
  }

  /**
   * @return {number} Stride.
   */
  getStride() {
    return this.stride;
  }

  /**
   * @param {import("./Geometry.js").GeometryLayout} layout Layout.
   * @param {Array<number>} flatCoordinates Flat coordinates.
   */
  setFlatCoordinates(layout, flatCoordinates) {
    this.stride = getStrideForLayout(layout);
    this.layout = layout;
    this.flatCoordinates = flatCoordinates;
  }

  /**
   * @abstract
   * @param {!Array<*>} coordinates Coordinates.
   * @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
   */
  setCoordinates(coordinates, layout) {
    abstract();
  }

  /**
   * @param {import("./Geometry.js").GeometryLayout|undefined} layout Layout.
   * @param {Array<*>} coordinates Coordinates.
   * @param {number} nesting Nesting.
   * @protected
   */
  setLayout(layout, coordinates, nesting) {
    let stride;
    if (layout) {
      stride = getStrideForLayout(layout);
    } else {
      for (let i = 0; i < nesting; ++i) {
        if (coordinates.length === 0) {
          this.layout = 'XY';
          this.stride = 2;
          return;
        }
        coordinates = /** @type {Array<unknown>} */ (coordinates[0]);
      }
      stride = coordinates.length;
      layout = getLayoutForStride(stride);
    }
    this.layout = layout;
    this.stride = stride;
  }

  /**
   * Apply a transform function to the coordinates of the geometry.
   * The geometry is modified in place.
   * If you do not want the geometry modified in place, first `clone()` it and
   * then use this function on the clone.
   * @param {import("../proj.js").TransformFunction} transformFn Transform function.
   * Called with a flat array of geometry coordinates.
   * @api
   * @override
   */
  applyTransform(transformFn) {
    if (this.flatCoordinates) {
      transformFn(
        this.flatCoordinates,
        this.flatCoordinates,
        this.layout.startsWith('XYZ') ? 3 : 2,
        this.stride,
      );
      this.changed();
    }
  }

  /**
   * Rotate the geometry around a given coordinate. This modifies the geometry
   * coordinates in place.
   * @param {number} angle Rotation angle in counter-clockwise radians.
   * @param {import("../coordinate.js").Coordinate} anchor The rotation center.
   * @api
   * @override
   */
  rotate(angle, anchor) {
    const flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      const stride = this.getStride();
      rotate(
        flatCoordinates,
        0,
        flatCoordinates.length,
        stride,
        angle,
        anchor,
        flatCoordinates,
      );
      this.changed();
    }
  }

  /**
   * Scale the geometry (with an optional origin).  This modifies the geometry
   * coordinates in place.
   * @param {number} sx The scaling factor in the x-direction.
   * @param {number} [sy] The scaling factor in the y-direction (defaults to sx).
   * @param {import("../coordinate.js").Coordinate} [anchor] The scale origin (defaults to the center
   *     of the geometry extent).
   * @api
   * @override
   */
  scale(sx, sy, anchor) {
    if (sy === undefined) {
      sy = sx;
    }
    if (!anchor) {
      anchor = getCenter(this.getExtent());
    }
    const flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      const stride = this.getStride();
      scale(
        flatCoordinates,
        0,
        flatCoordinates.length,
        stride,
        sx,
        sy,
        anchor,
        flatCoordinates,
      );
      this.changed();
    }
  }

  /**
   * Translate the geometry.  This modifies the geometry coordinates in place.  If
   * instead you want a new geometry, first `clone()` this geometry.
   * @param {number} deltaX Delta X.
   * @param {number} deltaY Delta Y.
   * @api
   * @override
   */
  translate(deltaX, deltaY) {
    const flatCoordinates = this.getFlatCoordinates();
    if (flatCoordinates) {
      const stride = this.getStride();
      translate(
        flatCoordinates,
        0,
        flatCoordinates.length,
        stride,
        deltaX,
        deltaY,
        flatCoordinates,
      );
      this.changed();
    }
  }
}

/**
 * @param {number} stride Stride.
 * @return {import("./Geometry.js").GeometryLayout} layout Layout.
 */
export function getLayoutForStride(stride) {
  let layout;
  if (stride == 2) {
    layout = 'XY';
  } else if (stride == 3) {
    layout = 'XYZ';
  } else if (stride == 4) {
    layout = 'XYZM';
  }
  return /** @type {import("./Geometry.js").GeometryLayout} */ (layout);
}

/**
 * @param {import("./Geometry.js").GeometryLayout} layout Layout.
 * @return {number} Stride.
 */
export function getStrideForLayout(layout) {
  let stride;
  if (layout == 'XY') {
    stride = 2;
  } else if (layout == 'XYZ' || layout == 'XYM') {
    stride = 3;
  } else if (layout == 'XYZM') {
    stride = 4;
  }
  return /** @type {number} */ (stride);
}

/**
 * @param {SimpleGeometry} simpleGeometry Simple geometry.
 * @param {import("../transform.js").Transform} transform Transform.
 * @param {Array<number>} [dest] Destination.
 * @return {Array<number>} Transformed flat coordinates.
 */
export function transformGeom2D(simpleGeometry, transform, dest) {
  const flatCoordinates = simpleGeometry.getFlatCoordinates();
  if (!flatCoordinates) {
    return null;
  }
  const stride = simpleGeometry.getStride();
  return transform2D(
    flatCoordinates,
    0,
    flatCoordinates.length,
    stride,
    transform,
    dest,
  );
}

export default SimpleGeometry;
