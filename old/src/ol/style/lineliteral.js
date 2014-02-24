goog.provide('ol.style.LineLiteral');

goog.require('goog.asserts');
goog.require('ol.style.Literal');


/**
 * @typedef {{color: string,
 *            opacity: number,
 *            width: number,
 *            zIndex: number}}
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
      options.color, 'color must be a string');
  /** @type {string} */
  this.color = options.color;

  goog.asserts.assertNumber(
      options.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = options.opacity;

  goog.asserts.assertNumber(
      options.width, 'width must be a number');
  /** @type {number} */
  this.width = options.width;

  goog.asserts.assertNumber(
      options.zIndex, 'zIndex must be a number');
  /** @type {number} */
  this.zIndex = options.zIndex;

};
goog.inherits(ol.style.LineLiteral, ol.style.Literal);


/**
 * @inheritDoc
 */
ol.style.LineLiteral.prototype.equals = function(other) {
  return this.color == other.color &&
      this.opacity == other.opacity &&
      this.width == other.width &&
      this.zIndex == other.zIndex;
};
