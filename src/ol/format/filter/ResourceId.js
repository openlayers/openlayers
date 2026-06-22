/**
 * @module ol/format/filter/ResourceId
 */
import Filter from './Filter.js';

/**
 * @classdesc
 * Represents a `<ResourceId>` comparison operator
 *
 * @api
 */
class ResourceId extends Filter {
  /**
   * @param {!string} rid Resource ID.
   */
  constructor(rid) {
    super('ResourceId');

    /**
     * @type {!string}
     */
    this.rid = rid;
  }
}

export default ResourceId;
