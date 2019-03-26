/**
 * @module ol/format/filter/And
 */
import LogicalNaryFilter from './LogicalNary.js';

/**
 * @classdesc
 * Represents a logical `<And>` operator between two or more filter conditions.
 *
 * @abstract
 */
class AndFilter extends LogicalNaryFilter {

  /**
   * @param {...import("./Filter.js").default} conditions Conditions.
   */
  constructor(conditions) {
    super('And', Array.prototype.slice.call(arguments));
  }

}

export default AndFilter;
