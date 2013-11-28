goog.provide('ol.style.Stroke');

goog.require('ol.color');



/**
 * @constructor
 * @param {ol.style.StrokeOptions} options Options.
 */
ol.style.Stroke = function(options) {

  /**
   * @type {ol.Color|string}
   */
  this.color = goog.isDef(options.color) ? options.color : null;

  /**
   * @type {string|undefined}
   */
  this.lineCap = options.lineCap;

  /**
   * @type {string|undefined}
   */
  this.lineJoin = options.lineJoin;

  /**
   * @type {number|undefined}
   */
  this.width = options.width;
};
