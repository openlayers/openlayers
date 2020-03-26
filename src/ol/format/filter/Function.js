/**
 * @module ol/format/filter/Function
 */
import ComparisonBinary from './ComparisonBinary.js';

/**
 * @classdesc
 * Represents a `<Function>` comparison operator.
 * @api
 */
class Function extends ComparisonBinary {

  /**
   * [constructor description]
   * @param {!string} name name of function.
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!string} expression Text pattern.
   * @param {boolean=} opt_matchCase Case-sensitive?
   */
  constructor(name, propertyName, expression, opt_matchCase) {
    super('PropertyName', propertyName, expression, opt_matchCase);

    /**
     * @type {!string}
     */
    this.name = name;
  }
}

export default Function;
