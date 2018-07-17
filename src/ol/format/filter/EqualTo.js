/**
 * @module ol/format/filter/EqualTo
 */
import ComparisonBinary from '../filter/ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<PropertyIsEqualTo>` comparison operator.
 */
class EqualTo extends ComparisonBinary {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!(string|number)} expression The value to compare.
   * @param {boolean=} opt_matchCase Case-sensitive?
   * @api
   */
  constructor(propertyName, expression, opt_matchCase) {
    super('PropertyIsEqualTo', propertyName, expression, opt_matchCase);
  }

}

export default EqualTo;
