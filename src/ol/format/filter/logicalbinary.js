goog.provide('ol.format.filter.LogicalBinary');

goog.require('ol');
goog.require('ol.format.filter.Logical');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature binary logical filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!ol.format.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.filter.Logical}
 */
ol.format.filter.LogicalBinary = function(tagName, conditionA, conditionB) {

  ol.format.filter.Logical.call(this, tagName);

  /**
   * @public
   * @type {!ol.format.filter.Filter}
   */
  this.conditionA = conditionA;

  /**
   * @public
   * @type {!ol.format.filter.Filter}
   */
  this.conditionB = conditionB;

};
ol.inherits(ol.format.filter.LogicalBinary, ol.format.filter.Logical);
