goog.provide('ol.colorlike');

goog.require('ol.color');


/**
 * @param {ol.Color|ol.ColorLike} color Color.
 * @return {ol.ColorLike} The color as an ol.ColorLike
 * @api
 */
ol.colorlike.asColorLike = function(color) {
  if (ol.colorlike.isColorLike(color)) {
    return /** @type {string|CanvasPattern|CanvasGradient} */ (color);
  } else {
    return ol.color.asString(/** @type {ol.Color} */ (color));
  }
};


/**
 * @param {?} color The value that is potentially an ol.ColorLike
 * @return {boolean} Whether the color is an ol.ColorLike
 */
ol.colorlike.isColorLike = function(color) {
  return (
    typeof color === 'string' ||
    color instanceof CanvasPattern ||
    color instanceof CanvasGradient
  );
};
