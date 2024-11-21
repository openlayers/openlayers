/**
 * @module ol/format/filter/LogicalNary
 */
import Filter from './Filter.js';
import {assert} from '../../asserts.js';

/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature n-ary logical filters.
 *
 * @abstract
 */
class LogicalNary extends Filter {
  /**
   * @param {!string} tagName The XML tag name for this filter.
   * @param {Array<import("./Filter.js").default>} conditions Conditions.
   */
  constructor(tagName, conditions) {
    super(tagName);

    /**
     * @type {Array<import("./Filter.js").default>}
     */
    this.conditions = conditions;
    assert(this.conditions.length >= 2, 'At least 2 conditions are required');
  }
}

export default LogicalNary;
