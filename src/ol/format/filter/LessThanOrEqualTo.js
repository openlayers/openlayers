/**
 * @module ol/format/filter/LessThanOrEqualTo
 */
import {inherits} from '../../util.js';
import ComparisonBinary from '../filter/ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {module:ol/format/filter/ComparisonBinary}
 * @api
 */
const LessThanOrEqualTo = function(propertyName, expression) {
  ComparisonBinary.call(this, 'PropertyIsLessThanOrEqualTo', propertyName, expression);
};

inherits(LessThanOrEqualTo, ComparisonBinary);
export default LessThanOrEqualTo;
