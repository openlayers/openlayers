goog.provide('ol.format.ogc.filter.ComparisonBinary');

goog.require('ol');
goog.require('ol.format.ogc.filter.Comparison');


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
 * @extends {ol.format.ogc.filter.Comparison}
 * @api
 */
ol.format.ogc.filter.ComparisonBinary = function(
    tagName, propertyName, expression, opt_matchCase) {

  ol.format.ogc.filter.Comparison.call(this, tagName, propertyName);

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
ol.inherits(ol.format.ogc.filter.ComparisonBinary, ol.format.ogc.filter.Comparison);
