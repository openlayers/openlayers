goog.provide('ol.format.filter.LogicalNary');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.format.filter.Filter');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature n-ary logical filters.
 *
 * @constructor
 * @abstract
 * @param {!string} tagName The XML tag name for this filter.
 * @param {...ol.format.filter.Filter} conditions Conditions.
 * @extends {ol.format.filter.Filter}
 */
ol.format.filter.LogicalNary = function(tagName, conditions) {

  ol.format.filter.Filter.call(this, tagName);

  /**
   * @public
   * @type {Array.<ol.format.filter.Filter>}
   */
  this.conditions = Array.prototype.slice.call(arguments, 1);
  ol.asserts.assert(this.conditions.length >= 2, 57); // At least 2 conditions are required.
};
ol.inherits(ol.format.filter.LogicalNary, ol.format.filter.Filter);
