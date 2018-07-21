/**
 * @module ol/format/filter/Contains
 */
import Spatial from '../filter/Spatial.js';

/**
 * @classdesc
 * Represents a `<Contains>` operator to test whether a geometry-valued property
 * contains a given geometry.
 * @api
 */
class Contains extends Spatial {

  /**
   * @param {!string} geometryName Geometry name to use.
   * @param {!module:ol/geom/Geometry} geometry Geometry.
   * @param {string=} opt_srsName SRS name. No srsName attribute will be
   *    set on geometries when this is not provided.
   */
  constructor(geometryName, geometry, opt_srsName) {

    super('Contains', geometryName, geometry, opt_srsName);

  }

}

export default Contains;
