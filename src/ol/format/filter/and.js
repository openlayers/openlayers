goog.provide('ol.format.filter.And');

goog.require('ol');
goog.require('ol.format.filter.LogicalNary');

/**
 * @classdesc
 * Represents a logical `<And>` operator between two or more filter conditions.
 *
 * @constructor
 * @param {...ol.format.filter.Filter|Array.<ol.format.filter.Filter>} conditions Conditions.
 * @extends {ol.format.filter.LogicalNary}
 * @api
 */
ol.format.filter.And = function(conditions) {
  var params = ['And'];
  if (Array.isArray(arguments[0])) {
    params = params.concat(Array.prototype.slice.call(arguments)[0]);
  } else {
    params = params.concat(Array.prototype.slice.call(arguments));
  }
  ol.format.filter.LogicalNary.apply(this, params);
};
ol.inherits(ol.format.filter.And, ol.format.filter.LogicalNary);
