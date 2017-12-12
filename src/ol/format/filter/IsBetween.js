/**
 * @module ol/format/filter/IsBetween
 */
import {inherits} from '../../index.js';
import _ol_format_filter_Comparison_ from '../filter/Comparison.js';

/**
 * @classdesc
 * Represents a `<PropertyIsBetween>` comparison operator.
 *
 * @constructor
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!number} lowerBoundary The lower bound of the range.
 * @param {!number} upperBoundary The upper bound of the range.
 * @extends {ol.format.filter.Comparison}
 * @api
 */
var _ol_format_filter_IsBetween_ = function(propertyName, lowerBoundary, upperBoundary) {
  _ol_format_filter_Comparison_.call(this, 'PropertyIsBetween', propertyName);

  /**
   * @public
   * @type {!number}
   */
  this.lowerBoundary = lowerBoundary;

  /**
   * @public
   * @type {!number}
   */
  this.upperBoundary = upperBoundary;
};

inherits(_ol_format_filter_IsBetween_, _ol_format_filter_Comparison_);
export default _ol_format_filter_IsBetween_;
