/**
 * @module ol/colorlike
 */
import {asString} from './color.js';


/**
 * @param {ol.Color|ol.ColorLike} color Color.
 * @return {ol.ColorLike} The color as an ol.ColorLike
 * @api
 */
export function asColorLike(color) {
  if (isColorLike(color)) {
    return /** @type {string|CanvasPattern|CanvasGradient} */ (color);
  } else {
    return asString(/** @type {ol.Color} */ (color));
  }
}


/**
 * @param {?} color The value that is potentially an ol.ColorLike
 * @return {boolean} Whether the color is an ol.ColorLike
 */
export function isColorLike(color) {
  return (
    typeof color === 'string' ||
    color instanceof CanvasPattern ||
    color instanceof CanvasGradient
  );
}
