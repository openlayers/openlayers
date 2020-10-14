/**
 * @module ol/format/filter/DWithin
 */
import Spatial from './Spatial.js';

/**
 * @classdesc
 * Represents a `<DWithin>` operator to test whether a geometry-valued property
 * is within a distance to a given geometry.
 * @api
 */
class DWithin extends Spatial {
  /**
   * @param {!string} geometryName Geometry name to use.
   * @param {!import("../../geom/Geometry.js").default} geometry Geometry.
   * @param {!number} distance Distance.
   * @param {!string} unit Unit.
   * @param {string=} opt_srsName SRS name. No srsName attribute will be
   *    set on geometries when this is not provided.
   */
  constructor(geometryName, geometry, distance, unit, opt_srsName) {
    super('DWithin', geometryName, geometry, opt_srsName);

    /**
     * @public
     * @type {!number}
     */
    this.distance = distance;

    /**
     * @public
     * @type {!string}
     */
    this.unit = unit;
  }
}

export default DWithin;
