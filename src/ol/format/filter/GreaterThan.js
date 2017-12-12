/**
 * @module ol/format/filter/GreaterThan
 */
import {inherits} from '../../index.js';
import _ol_format_filter_ComparisonBinary_ from '../filter/ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThan>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
var _ol_format_filter_GreaterThan_ = function(propertyName, expression) {
  _ol_format_filter_ComparisonBinary_.call(this, 'PropertyIsGreaterThan', propertyName, expression);
};

inherits(_ol_format_filter_GreaterThan_, _ol_format_filter_ComparisonBinary_);
export default _ol_format_filter_GreaterThan_;
