/**
 * @module ol/color
 */
import parseRgba from 'color-rgba';
import lchuv from 'color-space/lchuv.js';
import rgb from 'color-space/rgb.js';
import xyz from 'color-space/xyz.js';
import {clamp} from './math.js';

/**
 * A color represented as a short array [red, green, blue, alpha].
 * red, green, and blue should be integers in the range 0..255 inclusive.
 * alpha should be a float in the range 0..1 inclusive. If no alpha value is
 * given then `1` will be used.
 * @typedef {Array<number>} Color
 * @api
 */

/**
 * Color to indicate that no color should be rendered. This is meant to be used for per-reference
 * comparisons only.
 * @type {Color}
 */
export const NO_COLOR = [NaN, NaN, NaN, 0];

/**
 * Return the color as an rgba string.
 * @param {Color|string} color Color.
 * @return {string} Rgba string.
 * @api
 */
export function asString(color) {
  if (typeof color === 'string') {
    return color;
  }
  return toString(color);
}

/**
 * @type {number}
 */
const MAX_CACHE_SIZE = 1024;

/**
 * We maintain a small cache of parsed strings.  Whenever the cache grows too large,
 * we delete an arbitrary set of the entries.
 *
 * @type {Object<string, Color>}
 */
const cache = {};

/**
 * @type {number}
 */
let cacheSize = 0;

/**
 * @param {Color} color A color that may or may not have an alpha channel.
 * @return {Color} The input color with an alpha channel.  If the input color has
 * an alpha channel, the input color will be returned unchanged.  Otherwise, a new
 * array will be returned with the input color and an alpha channel of 1.
 */
export function withAlpha(color) {
  if (color.length === 4) {
    return color;
  }
  const output = color.slice();
  output[3] = 1;
  return output;
}

/**
 * @param {Color} color RGBA color.
 * @return {Color} LCHuv color with alpha.
 */
export function rgbaToLcha(color) {
  const output = xyz.lchuv(rgb.xyz(color));
  output[3] = color[3];
  return output;
}

/**
 * @param {Color} color LCHuv color with alpha.
 * @return {Color} RGBA color.
 */
export function lchaToRgba(color) {
  const output = xyz.rgb(lchuv.xyz(color));
  output[3] = color[3];
  return output;
}

/**
 * @param {string} s String.
 * @return {Color} Color.
 */
export function fromString(s) {
  if (s === 'none') {
    return NO_COLOR;
  }
  if (cache.hasOwnProperty(s)) {
    return cache[s];
  }
  if (cacheSize >= MAX_CACHE_SIZE) {
    let i = 0;
    for (const key in cache) {
      if ((i++ & 3) === 0) {
        delete cache[key];
        --cacheSize;
      }
    }
  }

  const color = parseRgba(s);
  if (color.length !== 4) {
    throw new Error('failed to parse "' + s + '" as color');
  }
  for (const c of color) {
    if (isNaN(c)) {
      throw new Error('failed to parse "' + s + '" as color');
    }
  }
  normalize(color);
  cache[s] = color;
  ++cacheSize;
  return color;
}

/**
 * Return the color as an array. This function maintains a cache of calculated
 * arrays which means the result should not be modified.
 * @param {Color|string} color Color.
 * @return {Color} Color.
 * @api
 */
export function asArray(color) {
  if (Array.isArray(color)) {
    return color;
  }
  return fromString(color);
}

/**
 * Exported for the tests.
 * @param {Color} color Color.
 * @return {Color} Clamped color.
 */
export function normalize(color) {
  color[0] = clamp((color[0] + 0.5) | 0, 0, 255);
  color[1] = clamp((color[1] + 0.5) | 0, 0, 255);
  color[2] = clamp((color[2] + 0.5) | 0, 0, 255);
  color[3] = clamp(color[3], 0, 1);
  return color;
}

/**
 * @param {Color} color Color.
 * @return {string} String.
 */
export function toString(color) {
  let r = color[0];
  if (r != (r | 0)) {
    r = (r + 0.5) | 0;
  }
  let g = color[1];
  if (g != (g | 0)) {
    g = (g + 0.5) | 0;
  }
  let b = color[2];
  if (b != (b | 0)) {
    b = (b + 0.5) | 0;
  }
  const a = color[3] === undefined ? 1 : Math.round(color[3] * 1000) / 1000;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/**
 * @param {string} s String.
 * @return {boolean} Whether the string is actually a valid color
 */
export function isStringColor(s) {
  try {
    fromString(s);
    return true;
  } catch {
    return false;
  }
}
