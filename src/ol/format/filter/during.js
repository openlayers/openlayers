import _ol_ from '../../index';
import _ol_format_filter_Comparison_ from '../filter/comparison';

/**
 * @classdesc
 * Represents a `<During>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} begin The begin date in ISO-8601 format.
 * @param {!string} end The end date in ISO-8601 format.
 * @extends {ol.format.filter.Comparison}
 * @api
 */
var _ol_format_filter_During_ = function(propertyName, begin, end) {
  _ol_format_filter_Comparison_.call(this, 'During', propertyName);

  /**
   * @public
   * @type {!string}
   */
  this.begin = begin;

  /**
   * @public
   * @type {!string}
   */
  this.end = end;
};

_ol_.inherits(_ol_format_filter_During_, _ol_format_filter_Comparison_);
export default _ol_format_filter_During_;
