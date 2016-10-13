goog.provide('ol.format.filter.Not');

goog.require('ol');
goog.require('ol.format.filter.Logical');


/**
 * @classdesc
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @constructor
 * @param {!ol.format.filter.Filter} condition Filter condition.
 * @extends {ol.format.filter.Logical}
 * @api
 */
ol.format.filter.Not = function(condition) {

  ol.format.filter.Logical.call(this, 'Not');

  /**
   * @public
   * @type {!ol.format.filter.Filter}
   */
  this.condition = condition;
};
ol.inherits(ol.format.filter.Not, ol.format.filter.Logical);
