/**
 * @module ol/geom/MultiCurve
 */
import {SimpleGeometry} from '../geom.js';
import {createOrUpdateEmpty, extend} from '../extent.js';
import GeometryType from "./GeometryType.js";

class MultiCurve extends SimpleGeometry {
  constructor(geometries, opt_layout) {
    super();

    this.geometries_ = geometries;
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
