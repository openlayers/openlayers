import _ol_ from '../../index';
import _ol_format_filter_LogicalNary_ from '../filter/logicalnary';

/**
 * @classdesc
 * Represents a logical `<And>` operator between two or more filter conditions.
 *
 * @constructor
 * @param {...ol.format.filter.Filter} conditions Conditions.
 * @extends {ol.format.filter.LogicalNary}
 * @api
 */
var _ol_format_filter_And_ = function(conditions) {
  var params = ['And'].concat(Array.prototype.slice.call(arguments));
  _ol_format_filter_LogicalNary_.apply(this, params);
};

_ol_.inherits(_ol_format_filter_And_, _ol_format_filter_LogicalNary_);
export default _ol_format_filter_And_;
