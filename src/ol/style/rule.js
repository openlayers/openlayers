goog.provide('ol.style.Rule');

goog.require('goog.asserts');

goog.require('ol.Feature');
goog.require('ol.expression');
goog.require('ol.expression.Expression');
goog.require('ol.style.Symbolizer');



/**
 * @constructor
 * @param {ol.style.RuleOptions} options Rule options.
 */
ol.style.Rule = function(options) {


  var filter = null;
  if (goog.isDef(options.filter)) {
    if (goog.isString(options.filter)) {
      filter = ol.expression.parse(options.filter);
    } else {
      goog.asserts.assert(options.filter instanceof ol.expression.Expression);
      filter = options.filter;
    }
  }

  /**
   * @type {ol.expression.Expression}
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
      true : !!ol.expression.evaluateFeature(this.filter_, feature);
};


/**
 * @return {Array.<ol.style.Symbolizer>} Symbolizers.
 */
ol.style.Rule.prototype.getSymbolizers = function() {
  return this.symbolizers_;
};
