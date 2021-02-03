/**
 * @module ol/format/filter/EqualTo
 */
import ComparisonBinary from './ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsEqualTo>` comparison operator.
 * @api
 */
class EqualTo extends ComparisonBinary {
  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!(string|number)} expression The value to compare.
   * @param {boolean} [opt_matchCase] Case-sensitive?
   */
  constructor(propertyName, expression, opt_matchCase) {
    super('PropertyIsEqualTo', propertyName, expression, opt_matchCase);
  }
}

export default EqualTo;
