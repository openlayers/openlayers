/**
 * @module ol/geom/MultiSurface
 */
import GeometryType from './GeometryType.js';
import {GeometryCollection} from '../geom.js';

class MultiSurface extends GeometryCollection {
  /**
   * @param {Array<import('../geom/Geometry.js').default>} [geometries] Geometries
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
    return GeometryType.MULTI_SURFACE;
  }
}

export default MultiSurface;
