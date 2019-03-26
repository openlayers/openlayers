/**
 * @module ol/format/filter/NotEqualTo
 */
import ComparisonBinaryFilter from './ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsNotEqualTo>` comparison operator.
 * @api
 */
class NotEqualToFilter extends ComparisonBinaryFilter {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!(string|number)} expression The value to compare.
   * @param {boolean=} opt_matchCase Case-sensitive?
   */
  constructor(propertyName, expression, opt_matchCase) {
    super('PropertyIsNotEqualTo', propertyName, expression, opt_matchCase);
  }

}

export default NotEqualToFilter;
