/**
 * @module ol/geom/MultiCurve
 */
import GeometryType from './GeometryType.js';
import {SimpleGeometry} from '../geom.js';
import {createOrUpdateEmpty, extend} from '../extent.js';

class MultiCurve extends SimpleGeometry {
  constructor(geometries, opt_layout) {
    super();

    this.geometries_ = geometries;
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
    this.changed();
  }

  /**
   * @return {Array<import("./Geometry.js")>} Geometries.
   */
  getGeometriesArray() {
    return this.geometries_;
  }

  /**
   * Make a complete copy of the geometry.
   * @return {MultiCurve} Clone.
   * @api
   */
  clone() {
    const multiCurve = new MultiCurve(this.geometries_);
    multiCurve.applyProperties(this);
    return multiCurve;
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
   * Create a simplified version of this geometry using the Douglas Peucker algorithm.
   * @param {number} squaredTolerance Squared tolerance.
   * @return {SimpleGeometry} Simplified geometry.
   */
  getSimplifiedGeometry(squaredTolerance) {
    // At the moment, the geometry is not simplified
    return this.clone();
  }

  getType() {
    return GeometryType.MULTI_CURVE;
  }
}

export default MultiCurve;
