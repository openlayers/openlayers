goog.provide('ol.style.Fill');

goog.require('ol.color');



/**
 * @constructor
 * @param {ol.style.FillOptions} options Options.
 */
ol.style.Fill = function(options) {

  /**
   * @type {ol.Color|string}
   */
  this.color = goog.isDef(options.color) ? options.color : null;
};
