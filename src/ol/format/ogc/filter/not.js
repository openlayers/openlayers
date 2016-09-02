goog.provide('ol.format.ogc.filter.Not');

goog.require('ol');
goog.require('ol.format.ogc.filter.Logical');


/**
 * @classdesc
 * Represents a logical `<Not>` operator for a filter condition.
 *
 * @constructor
 * @param {!ol.format.ogc.filter.Filter} condition Filter condition.
 * @extends {ol.format.ogc.filter.Logical}
 * @api
 */
ol.format.ogc.filter.Not = function(condition) {

  ol.format.ogc.filter.Logical.call(this, 'Not');

  /**
   * @public
   * @type {!ol.format.ogc.filter.Filter}
   */
  this.condition = condition;
};
ol.inherits(ol.format.ogc.filter.Not, ol.format.ogc.filter.Logical);
