goog.provide('ol.format.filter.NotEqualTo');

goog.require('ol');
goog.require('ol.format.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsNotEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
ol.format.filter.NotEqualTo = function(propertyName, expression, opt_matchCase) {
  ol.format.filter.ComparisonBinary.call(this, 'PropertyIsNotEqualTo', propertyName, expression, opt_matchCase);
};
ol.inherits(ol.format.filter.NotEqualTo, ol.format.filter.ComparisonBinary);
