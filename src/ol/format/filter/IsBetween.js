/**
 * @module ol/format/filter/IsBetween
 */
import {inherits} from '../../index.js';
import Comparison from '../filter/Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsBetween>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} lowerBoundary The lower bound of the range.
 * @param {!number} upperBoundary The upper bound of the range.
 * @extends {ol.format.filter.Comparison}
 * @api
 */
const IsBetween = function(propertyName, lowerBoundary, upperBoundary) {
  Comparison.call(this, 'PropertyIsBetween', propertyName);

  /**
   * @public
   * @type {!number}
   */
  this.lowerBoundary = lowerBoundary;

  /**
   * @public
   * @type {!number}
   */
  this.upperBoundary = upperBoundary;
};

inherits(IsBetween, Comparison);
export default IsBetween;
