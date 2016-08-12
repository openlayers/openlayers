goog.provide('ol.format.ogc.filter.GreaterThan');

goog.require('ol');
goog.require('ol.format.ogc.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThan>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.GreaterThan = function(propertyName, expression) {
  ol.format.ogc.filter.ComparisonBinary.call(this, 'PropertyIsGreaterThan', propertyName, expression);
};
ol.inherits(ol.format.ogc.filter.GreaterThan, ol.format.ogc.filter.ComparisonBinary);
