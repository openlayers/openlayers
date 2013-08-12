goog.provide('ol.style.LineLiteral');

goog.require('goog.asserts');
goog.require('ol.style.Literal');


/**
 * @typedef {{strokeColor: (string),
 *            strokeOpacity: (number),
 *            strokeWidth: (number)}}
 */
ol.style.LineLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.Literal}
 * @param {ol.style.LineLiteralOptions} options Line literal options.
 */
ol.style.LineLiteral = function(options) {
  goog.base(this);

  goog.asserts.assertString(
      options.strokeColor, 'strokeColor must be a string');
  /** @type {string} */
  this.strokeColor = options.strokeColor;

  goog.asserts.assertNumber(
      options.strokeOpacity, 'strokeOpacity must be a number');
  /** @type {number} */
  this.strokeOpacity = options.strokeOpacity;

  goog.asserts.assertNumber(
      options.strokeWidth, 'strokeWidth must be a number');
  /** @type {number} */
  this.strokeWidth = options.strokeWidth;

};
goog.inherits(ol.style.LineLiteral, ol.style.Literal);


/**
 * @inheritDoc
 */
ol.style.LineLiteral.prototype.equals = function(lineLiteral) {
  return this.strokeColor == lineLiteral.strokeColor &&
      this.strokeOpacity == lineLiteral.strokeOpacity &&
      this.strokeWidth == lineLiteral.strokeWidth;
};
