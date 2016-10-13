goog.provide('ol.format.filter.IsBetween');

goog.require('ol');
goog.require('ol.format.filter.Comparison');


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
ol.format.filter.IsBetween = function(propertyName, lowerBoundary, upperBoundary) {
  ol.format.filter.Comparison.call(this, 'PropertyIsBetween', propertyName);

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
ol.inherits(ol.format.filter.IsBetween, ol.format.filter.Comparison);
