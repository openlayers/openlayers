goog.provide('ol.style.TextPinLiteral');

goog.require('goog.asserts');
goog.require('ol.style.Literal');


/**
 * @typedef {{fontFamily: string,
 *            fontSize: number,
 *            fontColor: string,
 *            text: string,
 *            strokeColor: string,
 *            strokeWidth: number,
 *            strokeOpacity: number,
 *            fillColor: string,
 *            fillOpacity: number}}
 */
ol.style.TextPinLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.Literal}
 * @param {ol.style.TextPinLiteralOptions}
 *            options Text literal options.
 */
ol.style.TextPinLiteral = function(options) {
  goog.base(this);

  this.strokeColor = options.strokeColor;
  this.strokeWidth = options.strokeWidth;
  this.strokeOpacity = options.strokeOpacity;
  this.fillColor = options.fillColor;
  this.fillOpacity = options.fillOpacity;
  this.fontFamily = options.fontFamily;
  this.fontSize = options.fontSize;
  this.fontColor = options.fontColor;
  this.text = options.text;
};
goog.inherits(ol.style.TextPinLiteral, ol.style.Literal);
