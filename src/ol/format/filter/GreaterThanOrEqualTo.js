/**
 * @module ol/format/filter/GreaterThanOrEqualTo
 */
import ComparisonBinary from '../filter/ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 */
class GreaterThanOrEqualTo extends ComparisonBinary {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!number} expression The value to compare.
   * @api
   */
  constructor(propertyName, expression) {
    super('PropertyIsGreaterThanOrEqualTo', propertyName, expression);
  }

}

export default GreaterThanOrEqualTo;
