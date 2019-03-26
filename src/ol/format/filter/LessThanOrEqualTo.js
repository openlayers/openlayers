/**
 * @module ol/format/filter/LessThanOrEqualTo
 */
import ComparisonBinaryFilter from './ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 * @api
 */
class LessThanOrEqualToFilter extends ComparisonBinaryFilter {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!number} expression The value to compare.
   */
  constructor(propertyName, expression) {
    super('PropertyIsLessThanOrEqualTo', propertyName, expression);
  }

}

export default LessThanOrEqualToFilter;
