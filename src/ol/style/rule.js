goog.provide('ol.style.Rule');

goog.require('goog.asserts');

goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.style.Symbolizer');



/**
 * @constructor
 * @param {ol.style.RuleOptions} options Rule options.
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

};


/**
 * @param {ol.Feature} feature Feature.
 * @return {boolean} Does the rule apply to the feature?
 */
ol.style.Rule.prototype.applies = function(feature) {
  return goog.isNull(this.filter_) ?
      true : !!ol.expr.evaluateFeature(this.filter_, feature);
};


/**
 * @return {Array.<ol.style.Symbolizer>} Symbolizers.
 */
ol.style.Rule.prototype.getSymbolizers = function() {
  return this.symbolizers_;
};
