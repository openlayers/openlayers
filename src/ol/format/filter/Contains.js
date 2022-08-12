/**
 * @module ol/format/filter/Contains
 */
import Spatial from './Spatial.js';

/**
 * @classdesc
 * Represents a `<Contains>` operator to test whether a geometry-valued property
 * contains a given geometry.
 * @api
 */
class Contains extends Spatial {
  /**
   * @param {!string} geometryName Geometry name to use.
   * @param {!import("../../geom/Geometry.js").default} geometry Geometry.
   * @param {string} [srsName] SRS name. No srsName attribute will be
   *    set on geometries when this is not provided.
   */
  constructor(geometryName, geometry, srsName) {
    super('Contains', geometryName, geometry, srsName);
  }
}

export default Contains;
