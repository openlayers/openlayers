/**
 * @module ol/format/filter/Not
 */
import Filter from './Filter.js';

/**
 * @classdesc
 * Represents a logical `<Not>` operator for a filter condition.
 * @api
 */
class Not extends Filter {

  /**
   * @param {!import("./Filter.js").default} condition Filter condition.
   */
  constructor(condition) {

    super('Not');

    /**
     * @type {!import("./Filter.js").default}
     */
    this.condition = condition;

  }

}

export default Not;
