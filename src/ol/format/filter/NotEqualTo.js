/**
 * @module ol/format/filter/NotEqualTo
 */
import {inherits} from '../../util.js';
import ComparisonBinary from '../filter/ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsNotEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {module:ol/format/filter/ComparisonBinary}
 * @api
 */
const NotEqualTo = function(propertyName, expression, opt_matchCase) {
  ComparisonBinary.call(this, 'PropertyIsNotEqualTo', propertyName, expression, opt_matchCase);
};

inherits(NotEqualTo, ComparisonBinary);
export default NotEqualTo;
