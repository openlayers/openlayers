/**
 * @module ol/format/filter/EqualTo
 */
import {inherits} from '../../util.js';
import ComparisonBinary from '../filter/ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {module:ol/format/filter/ComparisonBinary}
 * @api
 */
const EqualTo = function(propertyName, expression, opt_matchCase) {
  ComparisonBinary.call(this, 'PropertyIsEqualTo', propertyName, expression, opt_matchCase);
};

inherits(EqualTo, ComparisonBinary);
export default EqualTo;
