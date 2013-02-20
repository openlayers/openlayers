goog.provide('ol.style.Style');

goog.require('ol.style.Rule');


/**
 * @typedef {{rules: (Array.<ol.style.Rule>)}}
 */
ol.style.StyleOptions;



/**
 * @constructor
 * @param {ol.style.StyleOptions} options Style options.
 */
ol.style.Style = function(options) {

  /**
   * @type {Array.<ol.style.Rule>}
   * @private
   */
  this.rules_ = goog.isDef(options.rules) ? options.rules : [];

};
