goog.provide('ol.Size');
goog.provide('ol.size');


/**
 * An array of numbers representing a size: `[width, height]`.
 * @typedef {Array.<number>}
 * @api stable
 */
ol.Size;


/**
 * Compares sizes for equality.
 * @param {ol.Size} a Size.
 * @param {ol.Size} b Size.
 * @return {boolean} Equals.
 */
ol.size.equals = function(a, b) {
  return a[0] == b[0] && a[1] == b[1];
};
