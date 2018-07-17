/**
 * @module ol/format/filter/Bbox
 */
import Filter from '../filter/Filter.js';

/**
 * @classdesc
 * Represents a `<BBOX>` operator to test whether a geometry-valued property
 * intersects a fixed bounding box
 *
 * @api
 */
class Bbox extends Filter {

  /**
   * @param {!string} geometryName Geometry name to use.
   * @param {!module:ol/extent~Extent} extent Extent.
   * @param {string=} opt_srsName SRS name. No srsName attribute will be set
   * on geometries when this is not provided.
   */
  constructor(geometryName, extent, opt_srsName) {

    super('BBOX');

    /**
     * @type {!string}
     */
    this.geometryName = geometryName;

    /**
     * @type {module:ol/extent~Extent}
     */
    this.extent = extent;

    /**
     * @type {string|undefined}
     */
    this.srsName = opt_srsName;
  }

}

export default Bbox;
