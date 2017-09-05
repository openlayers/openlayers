import _ol_ from '../../index';
import _ol_asserts_ from '../../asserts';
import _ol_format_filter_Filter_ from '../filter/filter';

/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature n-ary logical filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {...ol.format.filter.Filter} conditions Conditions.
 * @extends {ol.format.filter.Filter}
 */
var _ol_format_filter_LogicalNary_ = function(tagName, conditions) {

  _ol_format_filter_Filter_.call(this, tagName);

  /**
   * @public
   * @type {Array.<ol.format.filter.Filter>}
   */
  this.conditions = Array.prototype.slice.call(arguments, 1);
  _ol_asserts_.assert(this.conditions.length >= 2, 57); // At least 2 conditions are required.
};

_ol_.inherits(_ol_format_filter_LogicalNary_, _ol_format_filter_Filter_);
export default _ol_format_filter_LogicalNary_;
