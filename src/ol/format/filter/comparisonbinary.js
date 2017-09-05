import _ol_ from '../../index';
import _ol_format_filter_Comparison_ from '../filter/comparison';

/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature property binary comparison filters.
 *
 * @constructor
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.filter.Comparison}
 * @api
 */
var _ol_format_filter_ComparisonBinary_ = function(
    tagName, propertyName, expression, opt_matchCase) {

  _ol_format_filter_Comparison_.call(this, tagName, propertyName);

  /**
   * @public
   * @type {!(string|number)}
   */
  this.expression = expression;

  /**
   * @public
   * @type {boolean|undefined}
   */
  this.matchCase = opt_matchCase;
};

_ol_.inherits(_ol_format_filter_ComparisonBinary_, _ol_format_filter_Comparison_);
export default _ol_format_filter_ComparisonBinary_;
