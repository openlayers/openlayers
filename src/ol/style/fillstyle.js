goog.provide('ol.style.Fill');

goog.require('ol.color');



/**
 * @constructor
 * @param {olx.style.FillOptions=} opt_options Options.
 */
ol.style.Fill = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @type {ol.Color|string}
   */
  this.color = goog.isDef(options.color) ? options.color : null;
};
