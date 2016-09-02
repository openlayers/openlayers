goog.provide('ol.format.ogc.filter.EqualTo');

goog.require('ol');
goog.require('ol.format.ogc.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.ogc.filter.ComparisonBinary}
 * @api
 */
ol.format.ogc.filter.EqualTo = function(propertyName, expression, opt_matchCase) {
  ol.format.ogc.filter.ComparisonBinary.call(this, 'PropertyIsEqualTo', propertyName, expression, opt_matchCase);
};
ol.inherits(ol.format.ogc.filter.EqualTo, ol.format.ogc.filter.ComparisonBinary);
