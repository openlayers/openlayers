/**
 * @module ol/format/filter/IsBetween
 */
import {inherits} from '../../util.js';
import Comparison from '../filter/Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsBetween>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} lowerBoundary The lower bound of the range.
 * @param {!number} upperBoundary The upper bound of the range.
 * @extends {module:ol/format/filter/Comparison}
 * @api
 */
const IsBetween = function(propertyName, lowerBoundary, upperBoundary) {
  Comparison.call(this, 'PropertyIsBetween', propertyName);

  /**
   * @type {!number}
   */
  this.lowerBoundary = lowerBoundary;

  /**
   * @type {!number}
   */
  this.upperBoundary = upperBoundary;
};

inherits(IsBetween, Comparison);
export default IsBetween;
