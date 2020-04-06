/**
 * @module ol/format/filter/Within
 */
import Spatial from './Spatial.js';

/**
 * @classdesc
 * Represents a `<Within>` operator to test whether a geometry-valued property
 * is within a given geometry.
 * @api
 */
class Within extends Spatial {
  /**
   * @param {!string} geometryName Geometry name to use.
   * @param {!import("../../geom/Geometry.js").default} geometry Geometry.
   * @param {string=} opt_srsName SRS name. No srsName attribute will be
   *    set on geometries when this is not provided.
   */
  constructor(geometryName, geometry, opt_srsName) {
    super('Within', geometryName, geometry, opt_srsName);
  }
}

export default Within;
