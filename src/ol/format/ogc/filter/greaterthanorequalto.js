goog.provide('ol.format.ogc.filter.GreaterThanOrEqualTo');

goog.require('ol');
goog.require('ol.format.ogc.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsGreaterThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.GreaterThanOrEqualTo = function(propertyName, expression) {
  ol.format.ogc.filter.ComparisonBinary.call(this, 'PropertyIsGreaterThanOrEqualTo', propertyName, expression);
};
ol.inherits(ol.format.ogc.filter.GreaterThanOrEqualTo, ol.format.ogc.filter.ComparisonBinary);
