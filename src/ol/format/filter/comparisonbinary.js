goog.provide('ol.format.filter.ComparisonBinary');

goog.require('ol');
goog.require('ol.format.filter.Comparison');


/**
 * @classdesc
 * Abstract class; normally only used for creating subclasses and not instantiated in apps.
 * Base class for WFS GetFeature property binary comparison filters.
 *
 * deprecated: This class will no longer be exported starting from the next major version.
 *
 * @constructor
 * @abstract
 * @param {!string} tagName The XML tag name for this filter.
 * @param {!string} propertyName Name of the context property to compare.
 * @param {!(string|number)} expression The value to compare.
 * @param {boolean=} opt_matchCase Case-sensitive?
 * @extends {ol.format.filter.Comparison}
 * @api
 */
ol.format.filter.ComparisonBinary = function(
    tagName, propertyName, expression, opt_matchCase) {

  ol.format.filter.Comparison.call(this, tagName, propertyName);

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
ol.inherits(ol.format.filter.ComparisonBinary, ol.format.filter.Comparison);
