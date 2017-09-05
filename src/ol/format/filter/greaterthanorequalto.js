import _ol_ from '../../index';
import _ol_format_filter_ComparisonBinary_ from '../filter/comparisonbinary';

/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
var _ol_format_filter_GreaterThanOrEqualTo_ = function(propertyName, expression) {
  _ol_format_filter_ComparisonBinary_.call(this, 'PropertyIsGreaterThanOrEqualTo', propertyName, expression);
};

_ol_.inherits(_ol_format_filter_GreaterThanOrEqualTo_, _ol_format_filter_ComparisonBinary_);
export default _ol_format_filter_GreaterThanOrEqualTo_;
