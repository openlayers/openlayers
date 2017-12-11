goog.provide('ol.format.filter.Not');

goog.require('ol');
goog.require('ol.format.filter.Filter');


/**
 * @classdesc
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @constructor
 * @param {!ol.format.filter.Filter} condition Filter condition.
 * @extends {ol.format.filter.Filter}
 * @api
 */
ol.format.filter.Not = function(condition) {

  ol.format.filter.Filter.call(this, 'Not');

  /**
   * @public
   * @type {!ol.format.filter.Filter}
   */
  this.condition = condition;
};
ol.inherits(ol.format.filter.Not, ol.format.filter.Filter);
