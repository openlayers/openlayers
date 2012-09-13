goog.provide('ol3.Size');

goog.require('goog.math.Size');



/**
 * @constructor
 * @extends {goog.math.Size}
 * @param {number} width Width.
 * @param {number} height Height.
 */
ol3.Size = function(width, height) {
  goog.base(this, width, height);
};
goog.inherits(ol3.Size, goog.math.Size);


/**
 * @param {ol3.Size} size Size.
 * @return {boolean} Equals.
 */
ol3.Size.prototype.equals = function(size) {
  return this.width == size.width && this.height == size.height;
};
