/**
 * @module ol/format/filter/Bbox
 */
import Filter from './Filter.js';

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
   * @param {!import("../../extent.js").Extent} extent Extent.
   * @param {string} [srsName] SRS name. No srsName attribute will be set
   * on geometries when this is not provided.
   */
  constructor(geometryName, extent, srsName) {
    super('BBOX');

    /**
     * @type {!string}
     */
    this.geometryName = geometryName;

    /**
     * @type {import("../../extent.js").Extent}
     */
    this.extent = extent;
    if (extent.length !== 4) {
      throw new Error(
        'Expected an extent with four values ([minX, minY, maxX, maxY])',
      );
    }

    /**
     * @type {string|undefined}
     */
    this.srsName = srsName;
  }
}

export default Bbox;
