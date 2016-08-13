goog.provide('ol.format.ogc.filter.NotEqualTo');

goog.require('ol');
goog.require('ol.format.ogc.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsNotEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.NotEqualTo = function(propertyName, expression, opt_matchCase) {
  ol.format.ogc.filter.ComparisonBinary.call(this, 'PropertyIsNotEqualTo', propertyName, expression, opt_matchCase);
};
ol.inherits(ol.format.ogc.filter.NotEqualTo, ol.format.ogc.filter.ComparisonBinary);
