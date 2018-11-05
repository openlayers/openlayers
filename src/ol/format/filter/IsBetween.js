/**
 * @module ol/format/filter/IsBetween
 */
import Comparison from './Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsBetween>` comparison operator.
 * @api
 */
class IsBetween extends Comparison {

  /**
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!number} lowerBoundary The lower bound of the range.
   * @param {!number} upperBoundary The upper bound of the range.
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
