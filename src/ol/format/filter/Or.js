/**
 * @module ol/format/filter/Or
 */
import LogicalNary from '../filter/LogicalNary.js';

/**
 * @classdesc
 * Represents a logical `<Or>` operator between two ore more filter conditions.
 * @api
 */
class Or extends LogicalNary {

  /**
   * @param {...import("./Filter.js").default} conditions Conditions.
   */
  constructor(conditions) {
    const params = ['Or'].concat(Array.prototype.slice.call(arguments));
    super(...params);
  }

}

export default Or;
