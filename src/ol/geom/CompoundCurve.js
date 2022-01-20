/**
 * @module ol/geom/CompoundCurve
 */
import GeometryCollection from './GeometryCollection.js';
import GeometryType from './GeometryType.js';

/**
 * @classdesc
 * CompoundCurve geometry.
 *
 * @api
 */
class CompoundCurve extends GeometryCollection {
  /**
   * @param {Array<import('../geom/Geometry.js').default>} [geometries] Geometries
   */
  constructor(geometries) {
    super(geometries);
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
    GeometryCollection.prototype.scale(sx, opt_sy, opt_anchor);
  }
}

export default CompoundCurve;
