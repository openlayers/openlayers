/**
 * @module ol/colorlike
 */
import {toString} from './color.js';


/**
 * A type accepted by CanvasRenderingContext2D.fillStyle
 * or CanvasRenderingContext2D.strokeStyle.
 * Represents a color, pattern, or gradient. The origin for patterns and
 * gradients as fill style is an increment of 512 css pixels from map coordinate
 * `[0, 0]`. For seamless repeat patterns, width and height of the pattern image
 * must be a factor of two (2, 4, 8, ..., 512).
 *
 * @typedef {string|CanvasPattern|CanvasGradient} ColorLike
 * @api
 */


/**
 * @param {module:ol/color~Color|module:ol/colorlike~ColorLike} color Color.
 * @return {module:ol/colorlike~ColorLike} The color as an {@link ol/colorlike~ColorLike}.
 * @api
 */
export function asColorLike(color) {
  if (isColorLike(color)) {
    return /** @type {string|CanvasPattern|CanvasGradient} */ (color);
  } else {
    return toString(/** @type {module:ol/color~Color} */ (color));
  }
}


/**
 * @param {?} color The value that is potentially an {@link ol/colorlike~ColorLike}.
 * @return {boolean} The color is an {@link ol/colorlike~ColorLike}.
 */
export function isColorLike(color) {
  return (
    typeof color === 'string' ||
    color instanceof CanvasPattern ||
    color instanceof CanvasGradient
  );
}
