goog.provide('ol.format.filter.Or');

goog.require('ol');
goog.require('ol.format.filter.LogicalBinary');


/**
 * @classdesc
 * Represents a logical `<Or>` operator between two filter conditions.
 *
 * @constructor
 * @param {!ol.format.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.filter.LogicalBinary}
 * @api
 */
ol.format.filter.Or = function(conditionA, conditionB) {
  ol.format.filter.LogicalBinary.call(this, 'Or', conditionA, conditionB);
};
ol.inherits(ol.format.filter.Or, ol.format.filter.LogicalBinary);
