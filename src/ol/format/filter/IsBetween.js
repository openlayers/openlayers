/**
 * @module ol/format/filter/IsBetween
 */
import Comparison from '../filter/Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsBetween>` comparison operator.
 */
class IsBetween extends Comparison {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!number} lowerBoundary The lower bound of the range.
   * @param {!number} upperBoundary The upper bound of the range.
   * @api
   */
  constructor(propertyName, lowerBoundary, upperBoundary) {
    super('PropertyIsBetween', propertyName);

    /**
     * @type {!number}
     */
    this.lowerBoundary = lowerBoundary;

    /**
     * @type {!number}
     */
    this.upperBoundary = upperBoundary;

  }
}

export default IsBetween;
