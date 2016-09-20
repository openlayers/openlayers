goog.provide('ol.format.filter.And');

goog.require('ol');
goog.require('ol.format.filter.LogicalBinary');

/**
 * @classdesc
 * Represents a logical `<And>` operator between two filter conditions.
 *
 * @constructor
 * @param {!ol.format.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.filter.LogicalBinary}
 * @api
 */
ol.format.filter.And = function(conditionA, conditionB) {
  ol.format.filter.LogicalBinary.call(this, 'And', conditionA, conditionB);
};
ol.inherits(ol.format.filter.And, ol.format.filter.LogicalBinary);
