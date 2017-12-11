goog.provide('ol.format.filter.During');

goog.require('ol');
goog.require('ol.format.filter.Comparison');


/**
 * @classdesc
 * Represents a `<During>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!string} begin The begin date in ISO-8601 format.
 * @param {!string} end The end date in ISO-8601 format.
 * @extends {ol.format.filter.Comparison}
 * @api
 */
ol.format.filter.During = function(propertyName, begin, end) {
  ol.format.filter.Comparison.call(this, 'During', propertyName);

  /**
   * @public
   * @type {!string}
   */
  this.begin = begin;

  /**
   * @public
   * @type {!string}
   */
  this.end = end;
};
ol.inherits(ol.format.filter.During, ol.format.filter.Comparison);
