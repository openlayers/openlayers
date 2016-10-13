goog.provide('ol.format.filter.GreaterThanOrEqualTo');

goog.require('ol');
goog.require('ol.format.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
ol.format.filter.GreaterThanOrEqualTo = function(propertyName, expression) {
  ol.format.filter.ComparisonBinary.call(this, 'PropertyIsGreaterThanOrEqualTo', propertyName, expression);
};
ol.inherits(ol.format.filter.GreaterThanOrEqualTo, ol.format.filter.ComparisonBinary);
