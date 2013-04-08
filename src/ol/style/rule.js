goog.provide('ol.style.Rule');

goog.require('ol.Feature');
goog.require('ol.filter.Filter');
goog.require('ol.style.Symbolizer');



/**
 * @constructor
 * @param {ol.style.RuleOptions} options Rule options.
 */
ol.style.Rule = function(options) {

  /**
   * @type {ol.filter.Filter}
   * @private
   */
  this.filter_ = goog.isDef(options.filter) ? options.filter : null;

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
  return goog.isNull(this.filter_) ? true : this.filter_.applies(feature);
};


/**
 * @return {Array.<ol.style.Symbolizer>} Symbolizers.
 */
ol.style.Rule.prototype.getSymbolizers = function() {
  return this.symbolizers_;
};
