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
var _ol_format_filter_Filter_ = function(tagName) {

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
_ol_format_filter_Filter_.prototype.getTagName = function() {
  return this.tagName_;
};
export default _ol_format_filter_Filter_;
