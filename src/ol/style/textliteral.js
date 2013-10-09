goog.provide('ol.style.TextLiteral');

goog.require('goog.asserts');
goog.require('ol.style.Literal');


/**
 * @typedef {{color: string,
 *            fontFamily: string,
 *            fontSize: number,
 *            fontWeight: string,
 *            text: string,
 *            opacity: number,
 *            strokeColor: (string|undefined),
 *            strokeOpacity: (number|undefined),
 *            strokeWidth: (number|undefined),
 *            zIndex: number}}
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

  goog.asserts.assertString(options.fontWeight, 'fontWeight must be a string');
  /** @type {string} */
  this.fontWeight = options.fontWeight;

  goog.asserts.assertString(options.text, 'text must be a string');
  /** @type {string} */
  this.text = options.text;

  goog.asserts.assertNumber(options.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = options.opacity;

  /** @type {string|undefined} */
  this.strokeColor = options.strokeColor;
  if (goog.isDef(this.strokeColor)) {
    goog.asserts.assertString(
        this.strokeColor, 'strokeColor must be a string');
  }

  /** @type {number|undefined} */
  this.strokeOpacity = options.strokeOpacity;
  if (goog.isDef(this.strokeOpacity)) {
    goog.asserts.assertNumber(
        this.strokeOpacity, 'strokeOpacity must be a number');
  }

  /** @type {number|undefined} */
  this.strokeWidth = options.strokeWidth;
  if (goog.isDef(this.strokeWidth)) {
    goog.asserts.assertNumber(
        this.strokeWidth, 'strokeWidth must be a number');
  }

  // if any stroke property is defined, all must be defined
  var strokeDef = goog.isDef(this.strokeColor) &&
      goog.isDef(this.strokeOpacity) &&
      goog.isDef(this.strokeWidth);
  var strokeUndef = !goog.isDef(this.strokeColor) &&
      !goog.isDef(this.strokeOpacity) &&
      !goog.isDef(this.strokeWidth);
  goog.asserts.assert(strokeDef || strokeUndef,
      'If any stroke property is defined, all must be defined');

  goog.asserts.assertNumber(options.zIndex, 'zIndex must be a number');
  /** @type {number} */
  this.zIndex = options.zIndex;

};
goog.inherits(ol.style.TextLiteral, ol.style.Literal);


/**
 * @inheritDoc
 */
ol.style.TextLiteral.prototype.equals = function(other) {
  return this.color == other.color &&
      this.fontFamily == other.fontFamily &&
      this.fontSize == other.fontSize &&
      this.fontWeight == other.fontWeight &&
      this.opacity == other.opacity &&
      this.strokeColor == other.strokeColor &&
      this.strokeOpacity == other.strokeOpacity &&
      this.strokeWidth == other.strokeWidth &&
      this.zIndex == other.zIndex;
};
