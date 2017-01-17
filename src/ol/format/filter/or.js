goog.provide('ol.format.filter.Or');

goog.require('ol');
goog.require('ol.format.filter.LogicalNary');


/**
 * @classdesc
 * Represents a logical `<Or>` operator between two ore more filter conditions.
 *
 * @constructor
 * @param {...ol.format.filter.Filter} conditions Conditions.
 * @extends {ol.format.filter.LogicalNary}
 * @api
 */
ol.format.filter.Or = function(conditions) {
  var params = ['Or'].concat(Array.prototype.slice.call(arguments));
  ol.format.filter.LogicalNary.apply(this, params);
};
ol.inherits(ol.format.filter.Or, ol.format.filter.LogicalNary);
