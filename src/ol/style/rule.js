goog.provide('ol.style.Rule');

goog.require('goog.asserts');

goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.style.Symbolizer');



/**
 * @constructor
 * @param {ol.style.RuleOptions} options Rule options.
 * @todo stability experimental
 */
ol.style.Rule = function(options) {


  var filter = null;
  if (goog.isDef(options.filter)) {
    if (goog.isString(options.filter)) {
      filter = ol.expr.parse(options.filter);
    } else {
      goog.asserts.assert(options.filter instanceof ol.expr.Expression);
      filter = options.filter;
    }
  }

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.filter_ = filter;

  /**
   * @type {Array.<ol.style.Symbolizer>}
   * @private
   */
  this.symbolizers_ = goog.isDef(options.symbolizers) ?
      options.symbolizers : [];

  /**
   * @type {number}
   * @private
   */
  this.minResolution_ = goog.isDef(options.minResolution) ?
      options.minResolution : 0;

  /**
   * @type {number}
   * @private
   */
  this.maxResolution_ = goog.isDef(options.maxResolution) ?
      options.maxResolution : Infinity;

};


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Map resolution.
 * @return {boolean} Does the rule apply to the feature?
 */
ol.style.Rule.prototype.applies = function(feature, resolution) {
  var applies = resolution >= this.minResolution_ &&
      resolution < this.maxResolution_;
  if (applies && !goog.isNull(this.filter_)) {
    applies = !!ol.expr.evaluateFeature(this.filter_, feature);
  }
  return applies;
};


/**
 * @return {Array.<ol.style.Symbolizer>} Symbolizers.
 */
ol.style.Rule.prototype.getSymbolizers = function() {
  return this.symbolizers_;
};
