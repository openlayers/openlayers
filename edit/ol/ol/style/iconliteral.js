goog.provide('ol.style.IconLiteral');

goog.require('ol.style.PointLiteral');


/**
 * @typedef {{url: string,
 *            width: (number|undefined),
 *            height: (number|undefined),
 *            opacity: number,
 *            rotation: number,
 *            xOffset: number,
 *            yOffset: number}}
 */
ol.style.IconLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.PointLiteral}
 * @param {ol.style.IconLiteralOptions} options Icon literal options.
 */
ol.style.IconLiteral = function(options) {

  /** @type {string} */
  this.url = options.url;

  /** @type {number|undefined} */
  this.width = options.width;

  /** @type {number|undefined} */
  this.height = options.height;

  /** @type {number} */
  this.opacity = options.opacity;

  /** @type {number} */
  this.rotation = options.rotation;

  /** @type {number} */
  this.xOffset = options.xOffset;

  /** @type {number} */
  this.yOffset = options.yOffset;

};
goog.inherits(ol.style.IconLiteral, ol.style.PointLiteral);


/**
 * @inheritDoc
 */
ol.style.IconLiteral.prototype.equals = function(iconLiteral) {
  return this.url == iconLiteral.url &&
      this.width == iconLiteral.width &&
      this.height == iconLiteral.height &&
      this.opacity == iconLiteral.opacity &&
      this.rotation == iconLiteral.rotation &&
      this.xOffset == iconLiteral.xOffset &&
      this.yOffset == iconLiteral.yOffset;
};
