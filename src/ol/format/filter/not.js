import _ol_ from '../../index';
import _ol_format_filter_Filter_ from '../filter/filter';

/**
 * @classdesc
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @constructor
 * @param {!ol.format.filter.Filter} condition Filter condition.
 * @extends {ol.format.filter.Filter}
 * @api
 */
var _ol_format_filter_Not_ = function(condition) {

  _ol_format_filter_Filter_.call(this, 'Not');

  /**
   * @public
   * @type {!ol.format.filter.Filter}
   */
  this.condition = condition;
};

_ol_.inherits(_ol_format_filter_Not_, _ol_format_filter_Filter_);
export default _ol_format_filter_Not_;
