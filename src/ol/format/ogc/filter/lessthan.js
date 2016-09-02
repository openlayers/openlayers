goog.provide('ol.format.ogc.filter.LessThan');

goog.require('ol');
goog.require('ol.format.ogc.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsLessThan>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.LessThan = function(propertyName, expression) {
  ol.format.ogc.filter.ComparisonBinary.call(this, 'PropertyIsLessThan', propertyName, expression);
};
ol.inherits(ol.format.ogc.filter.LessThan, ol.format.ogc.filter.ComparisonBinary);
