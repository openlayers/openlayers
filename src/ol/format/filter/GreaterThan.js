/**
 * @module ol/format/filter/GreaterThan
 */
import ComparisonBinary from './ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThan>` comparison operator.
 * @api
 */
class GreaterThan extends ComparisonBinary {
  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!number} expression The value to compare.
   */
  constructor(propertyName, expression) {
    super('PropertyIsGreaterThan', propertyName, expression);
  }
}

export default GreaterThan;
