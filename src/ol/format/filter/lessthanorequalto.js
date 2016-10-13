goog.provide('ol.format.filter.LessThanOrEqualTo');

goog.require('ol');
goog.require('ol.format.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
ol.format.filter.LessThanOrEqualTo = function(propertyName, expression) {
  ol.format.filter.ComparisonBinary.call(this, 'PropertyIsLessThanOrEqualTo', propertyName, expression);
};
ol.inherits(ol.format.filter.LessThanOrEqualTo, ol.format.filter.ComparisonBinary);
