goog.provide('ol.format.filter.EqualTo');

goog.require('ol');
goog.require('ol.format.filter.ComparisonBinary');


/**
 * @classdesc
 * Represents a `<PropertyIsEqualTo>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.filter.ComparisonBinary}
 * @api
 */
ol.format.filter.EqualTo = function(propertyName, expression, opt_matchCase) {
  ol.format.filter.ComparisonBinary.call(this, 'PropertyIsEqualTo', propertyName, expression, opt_matchCase);
};
ol.inherits(ol.format.filter.EqualTo, ol.format.filter.ComparisonBinary);
