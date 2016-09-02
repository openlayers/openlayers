goog.provide('ol.format.ogc.filter.LessThanOrEqualTo');

goog.require('ol');
goog.require('ol.format.ogc.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsLessThanOrEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} expression The value to compare.
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.LessThanOrEqualTo = function(propertyName, expression) {
  ol.format.ogc.filter.ComparisonBinary.call(this, 'PropertyIsLessThanOrEqualTo', propertyName, expression);
};
ol.inherits(ol.format.ogc.filter.LessThanOrEqualTo, ol.format.ogc.filter.ComparisonBinary);
