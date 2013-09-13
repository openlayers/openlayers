goog.provide('ol.style.TextLiteral');

goog.require('goog.asserts');
goog.require('ol.style.Literal');


/**
 * @typedef {{color: string,
 *            fontFamily: string,
 *            fontSize: number,
 *            text: string,
 *            opacity: number}}
 */
ol.style.TextLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.Literal}
 * @param {ol.style.TextLiteralOptions} options Text literal options.
 */
ol.style.TextLiteral = function(options) {

  goog.asserts.assertString(options.color, 'color must be a string');
  /** @type {string} */
  this.color = options.color;

  goog.asserts.assertString(options.fontFamily, 'fontFamily must be a string');
  /** @type {string} */
  this.fontFamily = options.fontFamily;

  goog.asserts.assertNumber(options.fontSize, 'fontSize must be a number');
  /** @type {number} */
  this.fontSize = options.fontSize;

  goog.asserts.assertString(options.text, 'text must be a string');
  /** @type {string} */
  this.text = options.text;

  goog.asserts.assertNumber(options.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = options.opacity;

};
goog.inherits(ol.style.TextLiteral, ol.style.Literal);


/**
 * @inheritDoc
 */
ol.style.TextLiteral.prototype.equals = function(textLiteral) {
  return this.color == textLiteral.color &&
      this.fontFamily == textLiteral.fontFamily &&
      this.fontSize == textLiteral.fontSize &&
      this.opacity == textLiteral.opacity;
};
