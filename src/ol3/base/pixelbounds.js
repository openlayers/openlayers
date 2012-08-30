goog.provide('ol3.PixelBounds');

goog.require('ol3.Rectangle');



/**
 * @constructor
 * @extends {ol3.Rectangle}
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 */
ol3.PixelBounds = function(minX, minY, maxX, maxY) {
  goog.base(this, minX, minY, maxX, maxY);
};
goog.inherits(ol3.PixelBounds, ol3.Rectangle);
