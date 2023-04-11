/**
 * @module ol/format/filter/NotEqualTo
 */
import ComparisonBinary from './ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsNotEqualTo>` comparison operator.
 * @api
 */
class NotEqualTo extends ComparisonBinary {
  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!(string|number)} expression The value to compare.
   * @param {boolean} [matchCase] Case-sensitive?
   */
  constructor(propertyName, expression, matchCase) {
    super('PropertyIsNotEqualTo', propertyName, expression, matchCase);
  }
}

export default NotEqualTo;
