goog.provide('ol.format.filter.LessThan');

goog.require('ol');
goog.require('ol.format.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsLessThan>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
ol.format.filter.LessThan = function(propertyName, expression) {
  ol.format.filter.ComparisonBinary.call(this, 'PropertyIsLessThan', propertyName, expression);
};
ol.inherits(ol.format.filter.LessThan, ol.format.filter.ComparisonBinary);
