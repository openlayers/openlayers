/**
 * @module ol/format/filter/And
 */
import LogicalNary from './LogicalNary.js';

/**
 * @classdesc
 * Represents a logical `<And>` operator between two or more filter conditions.
 *
 * @abstract
 */
class And extends LogicalNary {
  /**
   * @param {...import("./Filter.js").default} conditions Conditions.
   */
  constructor(conditions) {
    super('And', Array.prototype.slice.call(arguments));
  }
}

export default And;
