/**
 * @module ol/format/filter/LogicalNary
 */
import {inherits} from '../../util.js';
import {assert} from '../../asserts.js';
import Filter from '../filter/Filter.js';

/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature n-ary logical filters.
 *
 * @constructor
 * @abstract
 * @param {!string} tagName The XML tag name for this filter.
 * @param {...module:ol/format/filter/Filter} conditions Conditions.
 * @extends {module:ol/format/filter/Filter}
 */
const LogicalNary = function(tagName, conditions) {

  Filter.call(this, tagName);

  /**
   * @type {Array.<module:ol/format/filter/Filter>}
   */
  this.conditions = Array.prototype.slice.call(arguments, 1);
  assert(this.conditions.length >= 2, 57); // At least 2 conditions are required.
};

inherits(LogicalNary, Filter);
export default LogicalNary;
