/**
 * @module ol/color
 */
import colorNames from 'color-name';
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
 * This RegExp matches # followed by 3, 4, 6, or 8 hex digits.
 * @const
 * @type {RegExp}
 * @private
 */
const HEX_COLOR_RE_ = /^#([a-f0-9]{3}|[a-f0-9]{4}(?:[a-f0-9]{2}){0,2})$/i;

/**
 * Regular expression for matching potential named color style strings.
 * @const
 * @type {RegExp}
 * @private
 */
const NAMED_COLOR_RE_ = /^([a-z]*)$/i;

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
 * Return named color as an rgb(a) string.
 * @param {string} color Named color.
 * @return {string} RGB(A) string.
 */
function fromNamed(color) {
  const name = color.toLowerCase();
  if (!colorNames.hasOwnProperty(name)) {
    if (name === 'transparent') {
      return 'rgba(0,0,0,0)';
    }
    return '';
  }
  const rgb = colorNames[name];
  return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
}

/**
 * @param {string} s String.
 * @return {Color} Color.
 */
export const fromString = (function () {
  // We maintain a small cache of parsed strings.  To provide cheap LRU-like
  // semantics, whenever the cache grows too large we simply delete an
  // arbitrary 25% of the entries.

  /**
   * @const
   * @type {number}
   */
  const MAX_CACHE_SIZE = 1024;

  /**
   * @type {Object<string, Color>}
   */
  const cache = {};

  /**
   * @type {number}
   */
  let cacheSize = 0;

  return (
    /**
     * @param {string} s String.
     * @return {Color} Color.
     */
    function (s) {
      let color;
      if (cache.hasOwnProperty(s)) {
        color = cache[s];
      } else {
        if (cacheSize >= MAX_CACHE_SIZE) {
          let i = 0;
          for (const key in cache) {
            if ((i++ & 3) === 0) {
              delete cache[key];
              --cacheSize;
            }
          }
        }
        color = fromStringInternal_(s);
        cache[s] = color;
        ++cacheSize;
      }
      return color;
    }
  );
})();

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
 * @param {Array<number>} hsla HSLA.
 * @private
 * @return {Array<number>} RGBA.
 */
function hslaToRgba(hsla) {
  const h = hsla[0] / 360;
  const s = hsla[1] / 100;
  const l = hsla[2] / 100;
  const a = hsla.length > 3 ? hsla[3] : 1;

  function hueToRgb(p, q, t) {
    t = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    return t < 1 / 6
      ? p + (q - p) * 6 * t
      : t < 1 / 2
      ? q
      : t < 2 / 3
      ? p + (q - p) * (2 / 3 - t) * 6
      : p;
  }

  let r = l;
  let g = l;
  let b = l;

  if (s > 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255, a];
}

/**
 * @param {string} s String.
 * @private
 * @return {Color} Color.
 */
function fromStringInternal_(s) {
  let r, g, b, a, color;

  if (NAMED_COLOR_RE_.exec(s)) {
    s = fromNamed(s);
  }

  if (HEX_COLOR_RE_.exec(s)) {
    // hex
    const n = s.length - 1; // number of hex digits
    let d; // number of digits per channel
    if (n <= 4) {
      d = 1;
    } else {
      d = 2;
    }
    const hasAlpha = n === 4 || n === 8;
    r = parseInt(s.substr(1 + 0 * d, d), 16);
    g = parseInt(s.substr(1 + 1 * d, d), 16);
    b = parseInt(s.substr(1 + 2 * d, d), 16);
    if (hasAlpha) {
      a = parseInt(s.substr(1 + 3 * d, d), 16);
    } else {
      a = 255;
    }
    if (d == 1) {
      r = (r << 4) + r;
      g = (g << 4) + g;
      b = (b << 4) + b;
      if (hasAlpha) {
        a = (a << 4) + a;
      }
    }
    color = [r, g, b, a / 255];
  } else if (s.startsWith('rgba(')) {
    // rgba()
    color = s.slice(5, -1).split(',').map(Number);
    normalize(color);
  } else if (s.startsWith('rgb(')) {
    // rgb()
    color = s.slice(4, -1).split(',').map(Number);
    color.push(1);
    normalize(color);
  } else if (s.startsWith('hsla(')) {
    // hsla()
    color = hslaToRgba(s.slice(5, -1).split(',').map(parseFloat));
    normalize(color);
  } else if (s.startsWith('hsl(')) {
    // hsl()
    color = hslaToRgba(s.slice(4, -1).split(',').map(parseFloat));
    normalize(color);
  } else {
    throw new Error('Invalid color');
  }
  return color;
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
  const a = color[3] === undefined ? 1 : Math.round(color[3] * 100) / 100;
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/**
 * @param {string} s String.
 * @return {boolean} Whether the string is actually a valid color
 */
export function isStringColor(s) {
  if (NAMED_COLOR_RE_.test(s)) {
    s = fromNamed(s);
  }
  return (
    HEX_COLOR_RE_.test(s) ||
    s.startsWith('rgba(') ||
    s.startsWith('rgb(') ||
    s.startsWith('hsla(') ||
    s.startsWith('hsl(')
  );
}
