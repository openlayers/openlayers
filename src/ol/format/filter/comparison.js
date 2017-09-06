import _ol_ from '../../index';
import _ol_format_filter_Filter_ from '../filter/filter';

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
var _ol_format_filter_Comparison_ = function(tagName, propertyName) {

  _ol_format_filter_Filter_.call(this, tagName);

  /**
   * @public
   * @type {!string}
   */
  this.propertyName = propertyName;
};

_ol_.inherits(_ol_format_filter_Comparison_, _ol_format_filter_Filter_);
export default _ol_format_filter_Comparison_;
