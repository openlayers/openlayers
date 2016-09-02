goog.provide('ol.format.ogc.filter.And');

goog.require('ol');
goog.require('ol.format.ogc.filter.LogicalBinary');

/**
 * @classdesc
 * Represents a logical `<And>` operator between two filter conditions.
 *
 * @constructor
 * @param {!ol.format.ogc.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.ogc.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.ogc.filter.LogicalBinary}
 * @api
 */
ol.format.ogc.filter.And = function(conditionA, conditionB) {
  ol.format.ogc.filter.LogicalBinary.call(this, 'And', conditionA, conditionB);
};
ol.inherits(ol.format.ogc.filter.And, ol.format.ogc.filter.LogicalBinary);
