// FIXME export ol.style.Style

goog.provide('ol.style.Style');
goog.provide('ol.style.StyleFunction');

goog.require('ol.style.Fill');
goog.require('ol.style.Image');


/**
 * @typedef {{fill: (ol.style.Fill|undefined),
 *            image: (ol.style.Image|undefined),
 *            stroke: (ol.style.Stroke|undefined),
 *            text: (ol.style.Text|undefined),
 *            zIndex: (number|undefined)}}
 */
ol.style.StyleOptions;



/**
 * @constructor
 * @param {ol.style.StyleOptions} options Options.
 */
ol.style.Style = function(options) {

  /**
   * @type {ol.style.Fill}
   */
  this.fill = goog.isDef(options.fill) ? options.fill : null;

  /**
   * @type {ol.style.Image}
   */
  this.image = goog.isDef(options.image) ? options.image : null;

  /**
   * @type {ol.style.Stroke}
   */
  this.stroke = goog.isDef(options.stroke) ? options.stroke : null;

  /**
   * @type {ol.style.Text}
   */
  this.text = goog.isDef(options.text) ? options.text : null;

  /**
   * @type {number|undefined}
   */
  this.zIndex = options.zIndex;

};


/**
 * @typedef {function(ol.Feature): ol.style.Style}
 */
ol.style.StyleFunction;
