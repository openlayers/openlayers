import _ol_ from '../../index';
import _ol_format_filter_ComparisonBinary_ from '../filter/comparisonbinary';

/**
 * @classdesc
 * Represents a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
var _ol_format_filter_LessThanOrEqualTo_ = function(propertyName, expression) {
  _ol_format_filter_ComparisonBinary_.call(this, 'PropertyIsLessThanOrEqualTo', propertyName, expression);
};

_ol_.inherits(_ol_format_filter_LessThanOrEqualTo_, _ol_format_filter_ComparisonBinary_);
export default _ol_format_filter_LessThanOrEqualTo_;
