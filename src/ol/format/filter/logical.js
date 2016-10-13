goog.provide('ol.format.filter.Logical');

goog.require('ol');
goog.require('ol.format.filter.Filter');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature logical filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @extends {ol.format.filter.Filter}
 */
ol.format.filter.Logical = function(tagName) {
  ol.format.filter.Filter.call(this, tagName);
};
ol.inherits(ol.format.filter.Logical, ol.format.filter.Filter);
