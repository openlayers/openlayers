/**
 * @module ol/format/filter/LessThan
 */
import ComparisonBinaryFilter from './ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsLessThan>` comparison operator.
 * @api
 */
class LessThanFilter extends ComparisonBinaryFilter {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!number} expression The value to compare.
   */
  constructor(propertyName, expression) {
    super('PropertyIsLessThan', propertyName, expression);
  }

}

export default LessThanFilter;
