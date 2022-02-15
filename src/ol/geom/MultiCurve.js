/**
 * @module ol/geom/MultiCurve
 */
import GeometryType from './GeometryType.js';
import {GeometryCollection} from '../geom.js';

class MultiCurve extends GeometryCollection {
  /**
   * @param {Array<import('../geom/Geometry.js').default>} [geometries] geometries
   * @param {import("./GeometryLayout.js").default} [opt_layout] Layout.
   */
  constructor(geometries, opt_layout) {
    super(geometries);
  }

  /**
   * Get the type of this geometry.
   * @return {import("./GeometryType.js").default} Geometry type.
   * @api
   */
  getType() {
    return GeometryType.MULTI_CURVE;
  }
}

export default MultiCurve;
