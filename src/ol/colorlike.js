/**
 * @module ol/colorlike
 */
import {fromNamed,toString } from './color.js';

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
 * @param {import("./color.js").Color|ColorLike} color Color.
 * @return {ColorLike} The color as an {@link ol/colorlike~ColorLike}.
 * @api
 */
export function asColorLike(color) {
  if (Array.isArray(color)) {
    return toString(color);
  }
  return color;
}

/**
 * Return named color as an rgba string or hex.
 * @param {string} color Named color.
 * @param {number} opacity Opacity value
 * @return {string} Rgb string or hex.
 */
export function addOpacityToColor(color, opacity) {
  // Handle color names
  const colorToParse = fromNamed(color);
  if (colorToParse.startsWith('#')) {
    const rgbaColor = hexToRgba(colorToParse, opacity);
    return rgbaColor;
  }
  if (colorToParse.startsWith('rgb')) {
    const rgbParts = colorToParse.match(/(\d+)/g);
    if (rgbParts.length === 3) {
      const r = parseInt(rgbParts[0]);
      const g = parseInt(rgbParts[1]);
      const b = parseInt(rgbParts[2]);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  return colorToParse != '' ? colorToParse : color; // Return unchanged for unsupported formats
}

/**
 * Return named color as an rgba string or hex.
 * @param {string} hexColor Named hexColor.
 * @param {number} opacity Opacity value
 * @return {string} Rgba string.
 */
function hexToRgba(hexColor, opacity) {
  hexColor = hexColor.replace(/^#/, '');

  if (hexColor.length === 3) {
    hexColor = hexColor
      .split('')
      .map((char) => char + char)
      .join('');
  }

  const bigint = parseInt(hexColor, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
