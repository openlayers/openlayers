/**
 * @module ol/geom/CompoundCurve
 */
import GeometryType from './GeometryType.js';
import SimpleGeometry from './SimpleGeometry.js';
import {abstract} from '../util.js';
import {
  closestSquaredDistanceXY,
  createOrUpdateEmpty,
  extend, getCenter,
} from '../extent.js';
import {deflateCoordinates} from './flat/deflate.js';
import {inflateCoordinates} from './flat/inflate.js';

/**
 *
 */
class CompoundCurveSegmentDescription {
  constructor(type, start, length) {
    /**
     * @type {GeometryType}
     */
    this.type = type;

    /**
     * @type {number}
     */
    this.start = start;

    /**
     * @type {number}
     */
    this.length = length;
  }
}

class CompoundCurveDescription {
  constructor() {
    /**
     * @type {Array<import("../coordinate.js").Coordinate>}
     */
    this.coordinates = [];

    /**
     * @type {Array<CompoundCurveSegmentDescription>}
     */
    this.segmentDescriptions = [];
  }
}

/**
 * @classdesc
 * CompoundCurve geometry.
 *
 * @api
 */
class CompoundCurve extends SimpleGeometry {
  /**
   * @param {Array<import('../geom/Geometry.js').default>} [geometries] Geometries
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   */
  constructor(geometries, opt_layout) {
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

    /**
     * @private
     * @type {Array<import('../geom/SimpleGeometry.js').default>} [geometries] Geometries
     */
    this.geometries_ =
      /** @type {Array<import('../geom/SimpleGeometry.js').default>} */ (
        geometries
      );

    this.description_ = this.createDescription();

    this.setCoordinates_(
      /** @type {Array<import("../coordinate.js").Coordinate>} */ (
        this.description_.coordinates
      ),
      opt_layout
    );
  }

  /**
   * @return {CompoundCurveDescription} compound curve description
   */
  getDescription() {
    return this.description_;
  }

  /**
   * @private
   * @return {CompoundCurveDescription} compound curve description
   */
  createDescription() {
    const data = new CompoundCurveDescription();

    this.geometries_.forEach((geometry) => {
      const geometryCoordinates = geometry.getCoordinates();
      const segmentDescription = new CompoundCurveSegmentDescription(
        geometry.getType(),
        0,
        geometryCoordinates.length
      );

      if (data.coordinates.length < 1) {
        data.coordinates = data.coordinates.concat(geometryCoordinates);
      } else {
        segmentDescription.start = data.coordinates.length - 1;
        data.coordinates = data.coordinates.concat(
          geometryCoordinates.slice(1)
        );
      }

      data.segmentDescriptions.push(segmentDescription);
    });

    return data;
  }

  /**
   * Get the type of this geometry.
   * @return {import("./GeometryType.js").default} Geometry type.
   * @api
   */
  getType() {
    return GeometryType.COMPOUND_CURVE;
  }

  /**
   * This base class method has not been implemented yet, because whenever this
   * method will be called, only setting coordinates would not be enough: the geometries
   * should also be updated, which might not be trivial.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   * @api
   */
  setCoordinates(coordinates, opt_layout) {
    abstract();
  }

  /**
   * Set the coordinates of the compound curve.
   * @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   * @api
   */
  setCoordinates_(coordinates, opt_layout) {
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

  /**
   * Make a complete copy of the geometry.
   * @return {!CompoundCurve} Clone.
   * @api
   */
  clone() {
    const compoundCurve = new CompoundCurve(
      this.geometries_.slice(),
      this.layout
    );
    compoundCurve.applyProperties(this);
    return compoundCurve;
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
   * @param {import("../extent.js").Extent} extent Extent.
   * @protected
   * @return {import("../extent.js").Extent} extent Extent.
   */
  computeExtent(extent) {
    createOrUpdateEmpty(extent);
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      extend(extent, geometries[i].getExtent());
    }
    return extent;
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
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      minSquaredDistance = geometries[i].closestPointXY(
        x,
        y,
        closestPoint,
        minSquaredDistance
      );
    }
    return minSquaredDistance;
  }

  /**
   * Test if the geometry and the passed extent intersect.
   * @param {import("../extent.js").Extent} extent Extent.
   * @return {boolean} `true` if the geometry and the extent intersect.
   * @api
   */
  intersectsExtent(extent) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      if (geometries[i].intersectsExtent(extent)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Apply a transform function to the coordinates of the geometry.
   * The geometry is modified in place.
   * If you do not want the geometry modified in place, first `clone()` it and
   * then use this function on the clone.
   * @param {import("../proj.js").TransformFunction} transformFn Transform function.
   * Called with a flat array of geometry coordinates.
   * @api
   */
  applyTransform(transformFn) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      geometries[i].applyTransform(transformFn);
    }
    super.applyTransform(transformFn);
  }

  /**
   * Rotate the geometry around a given coordinate. This modifies the geometry
   * coordinates in place.
   * @param {number} angle Rotation angle in radians.
   * @param {import("../coordinate.js").Coordinate} anchor The rotation center.
   * @api
   */
  rotate(angle, anchor) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      geometries[i].rotate(angle, anchor);
    }
    super.rotate(angle, anchor);
  }

  /**
   * Scale the geometry (with an optional origin).  This modifies the geometry
   * coordinates in place.
   * @abstract
   * @param {number} sx The scaling factor in the x-direction.
   * @param {number} [opt_sy] The scaling factor in the y-direction (defaults to sx).
   * @param {import("../coordinate.js").Coordinate} [opt_anchor] The scale origin (defaults to the center
   *     of the geometry extent).
   * @api
   */
  scale(sx, opt_sy, opt_anchor) {
    let anchor = opt_anchor;
    if (!anchor) {
      anchor = getCenter(this.getExtent());
    }
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      geometries[i].scale(sx, opt_sy, anchor);
    }
    super.scale(sx, opt_sy, opt_anchor);
  }

  /**
   * Translate the geometry.  This modifies the geometry coordinates in place.  If
   * instead you want a new geometry, first `clone()` this geometry.
   * @param {number} deltaX Delta X.
   * @param {number} deltaY Delta Y.
   * @api
   */
  translate(deltaX, deltaY) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      geometries[i].translate(deltaX, deltaY);
    }
    super.translate(deltaX, deltaY);
  }
}

export default CompoundCurve;
