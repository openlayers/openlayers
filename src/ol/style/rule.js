goog.provide('ol.style.Rule');

goog.require('ol.filter.Filter');
goog.require('ol.style.Symbolizer');


/**
 * @typedef {{filter: (ol.filter.Filter),
 *            symbolizers: (Array.<ol.style.Symbolizer>)}}
 */
ol.style.RuleOptions;



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
