goog.provide('ol.format.filter.Comparison');

goog.require('ol');
goog.require('ol.format.filter.Filter');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature property comparison filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} propertyName Name of the context property to compare.
 * @extends {ol.format.filter.Filter}
 * @api
 */
ol.format.filter.Comparison = function(tagName, propertyName) {

  ol.format.filter.Filter.call(this, tagName);

  /**
   * @public
   * @type {!string}
   */
  this.propertyName = propertyName;
};
ol.inherits(ol.format.filter.Comparison, ol.format.filter.Filter);
