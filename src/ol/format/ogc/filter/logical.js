goog.provide('ol.format.ogc.filter.Logical');

goog.require('ol');
goog.require('ol.format.ogc.filter.Filter');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature logical filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @extends {ol.format.ogc.filter.Filter}
 */
ol.format.ogc.filter.Logical = function(tagName) {
  ol.format.ogc.filter.Filter.call(this, tagName);
};
ol.inherits(ol.format.ogc.filter.Logical, ol.format.ogc.filter.Filter);
