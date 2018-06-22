/**
 * @module ol/format/filter/GreaterThanOrEqualTo
 */
import {inherits} from '../../util.js';
import ComparisonBinary from '../filter/ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {module:ol/format/filter/ComparisonBinary}
 * @api
 */
const GreaterThanOrEqualTo = function(propertyName, expression) {
  ComparisonBinary.call(this, 'PropertyIsGreaterThanOrEqualTo', propertyName, expression);
};

inherits(GreaterThanOrEqualTo, ComparisonBinary);
export default GreaterThanOrEqualTo;
