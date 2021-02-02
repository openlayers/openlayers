/**
 * @module ol/format/filter/Filter
 */

/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature filters.
 *
 * @abstract
 */
class Filter {
  /**
   * @param {!string} tagName The XML tag name for this filter.
   */
  constructor(tagName) {
    /**
     * @private
     * @type {!string}
     */
    this.tagName_ = tagName;
  }

  /**
   * The XML tag name for a filter.
   * @return {!string} Name.
   */
  getTagName() {
    return this.tagName_;
  }
}

export default Filter;
