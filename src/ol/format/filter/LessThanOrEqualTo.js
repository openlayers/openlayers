/**
 * @module ol/format/filter/LessThanOrEqualTo
 */
import ComparisonBinary from '../filter/ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 */
class LessThanOrEqualTo extends ComparisonBinary {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!number} expression The value to compare.
   * @api
   */
  constructor(propertyName, expression) {
    super('PropertyIsLessThanOrEqualTo', propertyName, expression);
  }

}

export default LessThanOrEqualTo;
