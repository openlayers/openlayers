goog.provide('ol.format.ogc.filter.Or');

goog.require('ol');
goog.require('ol.format.ogc.filter.LogicalBinary');


/**
 * @classdesc
 * Represents a logical `<Or>` operator between two filter conditions.
 *
 * @constructor
 * @param {!ol.format.ogc.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.ogc.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.ogc.filter.LogicalBinary}
 * @api
 */
ol.format.ogc.filter.Or = function(conditionA, conditionB) {
  ol.format.ogc.filter.LogicalBinary.call(this, 'Or', conditionA, conditionB);
};
ol.inherits(ol.format.ogc.filter.Or, ol.format.ogc.filter.LogicalBinary);
