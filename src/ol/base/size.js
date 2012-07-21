goog.provide('ol.Size');

goog.require('goog.math.Size');



/**
 * @constructor
 * @extends {goog.math.Size}
 * @param {number} width Width.
 * @param {number} height Height.
 */
ol.Size = function(width, height) {
  goog.base(this, width, height);
};
goog.inherits(ol.Size, goog.math.Size);


/**
 * @param {ol.Size} size Size.
 * @return {boolean} Equals.
 */
ol.Size.prototype.equals = function(size) {
  return this.width == size.width && this.height == size.height;
};
