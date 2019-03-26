/**
 * @module ol/format/filter/IsBetween
 */
import ComparisonFilter from './Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsBetween>` comparison operator.
 * @api
 */
class IsBetweenFilter extends ComparisonFilter {

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

export default IsBetweenFilter;
