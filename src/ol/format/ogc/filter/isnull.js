goog.provide('ol.format.ogc.filter.IsNull');

goog.require('ol');
goog.require('ol.format.ogc.filter.Comparison');


/**
 * @classdesc
 * Represents a `<PropertyIsNull>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @extends {ol.format.ogc.filter.Comparison}
 * @api
 */
ol.format.ogc.filter.IsNull = function(propertyName) {
  ol.format.ogc.filter.Comparison.call(this, 'PropertyIsNull', propertyName);
};
ol.inherits(ol.format.ogc.filter.IsNull, ol.format.ogc.filter.Comparison);
