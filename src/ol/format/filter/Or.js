/**
 * @module ol/format/filter/Or
 */
import LogicalNaryFilter from './LogicalNary.js';

/**
 * @classdesc
 * Represents a logical `<Or>` operator between two ore more filter conditions.
 * @api
 */
class OrFilter extends LogicalNaryFilter {

  /**
   * @param {...import("./Filter.js").default} conditions Conditions.
   */
  constructor(conditions) {
    super('Or', Array.prototype.slice.call(arguments));
  }

}

export default OrFilter;
