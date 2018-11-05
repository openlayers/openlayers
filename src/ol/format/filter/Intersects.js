/**
 * @module ol/format/filter/Intersects
 */
import Spatial from './Spatial.js';

/**
 * @classdesc
 * Represents a `<Intersects>` operator to test whether a geometry-valued property
 * intersects a given geometry.
 * @api
 */
class Intersects extends Spatial {

  /**
   * @param {!string} geometryName Geometry name to use.
   * @param {!import("../../geom/Geometry.js").default} geometry Geometry.
   * @param {string=} opt_srsName SRS name. No srsName attribute will be
   *    set on geometries when this is not provided.
   */
  constructor(geometryName, geometry, opt_srsName) {
    super('Intersects', geometryName, geometry, opt_srsName);
  }

}

export default Intersects;
