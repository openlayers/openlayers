/**
 * @module ol/format/filter/ComparisonBinary
 */
import Comparison from './Comparison.js';

/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature property binary comparison filters.
 *
 * @abstract
 */
class ComparisonBinary extends Comparison {
  /**
   * @param {!string} tagName The XML tag name for this filter.
   * @param {!string} propertyName Name of the context property to compare.
   * @param {!(string|number)} expression The value to compare.
   * @param {boolean} [matchCase] Case-sensitive?
   */
  constructor(tagName, propertyName, expression, matchCase) {
    super(tagName, propertyName);

    /**
     * @type {!(string|number)}
     */
    this.expression = expression;

    /**
     * @type {boolean|undefined}
     */
    this.matchCase = matchCase;
  }
}

export default ComparisonBinary;
