/**
 * @module ol/format/filter/GreaterThanOrEqualTo
 */
import ComparisonBinary from './ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 * @api
 */
class GreaterThanOrEqualTo extends ComparisonBinary {
  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!number} expression The value to compare.
   */
  constructor(propertyName, expression) {
    super('PropertyIsGreaterThanOrEqualTo', propertyName, expression);
  }
}

export default GreaterThanOrEqualTo;
