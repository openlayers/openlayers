goog.provide('ol.format.filter.And');

goog.require('ol');
goog.require('ol.format.filter.LogicalNary');

/**
 * @classdesc
 * Represents a logical `<And>` operator between two or more filter conditions.
 *
 * deprecated: This class will no longer be exported starting from the next major version.
 *
 * @constructor
 * @abstract
 * @param {...ol.format.filter.Filter} conditions Conditions.
 * @extends {ol.format.filter.LogicalNary}
 * @api
 */
ol.format.filter.And = function(conditions) {
  var params = ['And'].concat(Array.prototype.slice.call(arguments));
  ol.format.filter.LogicalNary.apply(this, params);
};
ol.inherits(ol.format.filter.And, ol.format.filter.LogicalNary);
