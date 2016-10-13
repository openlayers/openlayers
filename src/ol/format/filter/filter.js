goog.provide('ol.format.filter.Filter');

goog.require('ol');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @struct
 * @api
 */
ol.format.filter.Filter = function(tagName) {

  /**
   * @private
   * @type {!string}
   */
  this.tagName_ = tagName;
};

/**
 * The XML tag name for a filter.
 * @returns {!string} Name.
 */
ol.format.filter.Filter.prototype.getTagName = function() {
  return this.tagName_;
};
