import _ol_ from '../../index';
import _ol_format_filter_ComparisonBinary_ from '../filter/comparisonbinary';

/**
 * @classdesc
 * Represents a `<PropertyIsLessThan>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
var _ol_format_filter_LessThan_ = function(propertyName, expression) {
  _ol_format_filter_ComparisonBinary_.call(this, 'PropertyIsLessThan', propertyName, expression);
};

_ol_.inherits(_ol_format_filter_LessThan_, _ol_format_filter_ComparisonBinary_);
export default _ol_format_filter_LessThan_;
