import _ol_ from '../../index';
import _ol_format_filter_LogicalNary_ from '../filter/logicalnary';

/**
 * @classdesc
 * Represents a logical `<Or>` operator between two ore more filter conditions.
 *
 * @constructor
 * @param {...ol.format.filter.Filter} conditions Conditions.
 * @extends {ol.format.filter.LogicalNary}
 * @api
 */
var _ol_format_filter_Or_ = function(conditions) {
  var params = ['Or'].concat(Array.prototype.slice.call(arguments));
  _ol_format_filter_LogicalNary_.apply(this, params);
};

_ol_.inherits(_ol_format_filter_Or_, _ol_format_filter_LogicalNary_);
export default _ol_format_filter_Or_;
