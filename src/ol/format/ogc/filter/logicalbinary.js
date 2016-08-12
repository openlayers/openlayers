goog.provide('ol.format.ogc.filter.LogicalBinary');

goog.require('ol');
goog.require('ol.format.ogc.filter.Logical');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature binary logical filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!ol.format.ogc.filter.Filter} conditionA First filter condition.
 * @param {!ol.format.ogc.filter.Filter} conditionB Second filter condition.
 * @extends {ol.format.ogc.filter.Logical}
 */
ol.format.ogc.filter.LogicalBinary = function(tagName, conditionA, conditionB) {

  ol.format.ogc.filter.Logical.call(this, tagName);

  /**
   * @public
   * @type {!ol.format.ogc.filter.Filter}
   */
  this.conditionA = conditionA;

  /**
   * @public
   * @type {!ol.format.ogc.filter.Filter}
   */
  this.conditionB = conditionB;

};
ol.inherits(ol.format.ogc.filter.LogicalBinary, ol.format.ogc.filter.Logical);
