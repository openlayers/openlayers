/**
 * @module ol/color
 */
import {createCanvasContext2D} from './dom.js';
import {clamp, toFixed} from './math.js';

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

let colorParseContext;
/**
 * @return {CanvasRenderingContext2D} The color parse context
 */
function getColorParseContext() {
  if (!colorParseContext) {
    colorParseContext = createCanvasContext2D(1, 1, undefined, {
      willReadFrequently: true,
      desynchronized: true,
    });
  }
  return colorParseContext;
}

const rgbModernRegEx =
  /^rgba?\(\s*(\d+%?)\s+(\d+%?)\s+(\d+%?)(?:\s*\/\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i;
const rgbLegacyAbsoluteRegEx =
  /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i;
const rgbLegacyPercentageRegEx =
  /^rgba?\(\s*(\d+%)\s*,\s*(\d+%)\s*,\s*(\d+%)(?:\s*,\s*(\d+%|\d*\.\d+|[01]))?\s*\)$/i;
const hexRegEx = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;

/**
 * @param {string} s Color component as number or percentage.
 * @param {number} divider Divider for percentage.
 * @return {number} Color component.
 */
function toColorComponent(s, divider) {
  return s.endsWith('%')
    ? Number(s.substring(0, s.length - 1)) / divider
    : Number(s);
}

/**
 * @param {string} color Color string.
 */
function throwInvalidColor(color) {
  throw new Error('failed to parse "' + color + '" as color');
}

/**
 * @param {string} color Color string.
 * @return {Color} RGBa color array.
 */
function parseRgba(color) {
  // Fast lane for rgb(a) colors
  if (color.toLowerCase().startsWith('rgb')) {
    const rgb =
      color.match(rgbLegacyAbsoluteRegEx) ||
      color.match(rgbModernRegEx) ||
      color.match(rgbLegacyPercentageRegEx);
    if (rgb) {
      const alpha = rgb[4];
      const rgbDivider = 100 / 255;
      return [
        clamp((toColorComponent(rgb[1], rgbDivider) + 0.5) | 0, 0, 255),
        clamp((toColorComponent(rgb[2], rgbDivider) + 0.5) | 0, 0, 255),
        clamp((toColorComponent(rgb[3], rgbDivider) + 0.5) | 0, 0, 255),
        alpha !== undefined ? clamp(toColorComponent(alpha, 100), 0, 1) : 1,
      ];
    }
    throwInvalidColor(color);
  }
  // Fast lane for hex colors (also with alpha)
  if (color.startsWith('#')) {
    if (hexRegEx.test(color)) {
      const hex = color.substring(1);
      const step = hex.length <= 4 ? 1 : 2;
      const colorFromHex = [0, 0, 0, 255];
      for (let i = 0, ii = hex.length; i < ii; i += step) {
        let colorComponent = parseInt(hex.substring(i, i + step), 16);
        if (step === 1) {
          colorComponent += colorComponent << 4;
        }
        colorFromHex[i / step] = colorComponent;
      }
      colorFromHex[3] = colorFromHex[3] / 255;
      return colorFromHex;
    }
    throwInvalidColor(color);
  }
  // Use canvas color serialization to parse the color into hex or rgba
  // See https://www.w3.org/TR/2021/SPSD-2dcontext-20210128/#serialization-of-a-color
  const context = getColorParseContext();
  context.fillStyle = '#abcdef';
  let invalidCheckFillStyle = context.fillStyle;
  context.fillStyle = color;
  if (context.fillStyle === invalidCheckFillStyle) {
    context.fillStyle = '#fedcba';
    invalidCheckFillStyle = context.fillStyle;
    context.fillStyle = color;
    if (context.fillStyle === invalidCheckFillStyle) {
      throwInvalidColor(color);
    }
  }
  const colorString = context.fillStyle;
  if (colorString.startsWith('#') || colorString.startsWith('rgba')) {
    return parseRgba(colorString);
  }
  context.clearRect(0, 0, 1, 1);
  context.fillRect(0, 0, 1, 1);
  const colorFromImage = Array.from(context.getImageData(0, 0, 1, 1).data);
  colorFromImage[3] = toFixed(colorFromImage[3] / 255, 3);
  return colorFromImage;
}

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

// The functions b1, b2, a1, a2, rgbaToLcha and lchaToRgba below are adapted from
// https://stackoverflow.com/a/67219995/2389327

/**
 * @param {number} v Input value.
 * @return {number} Output value.
 */
function b1(v) {
  return v > 0.0031308 ? Math.pow(v, 1 / 2.4) * 269.025 - 14.025 : v * 3294.6;
}

/**
 * @param {number} v Input value.
 * @return {number} Output value.
 */
function b2(v) {
  return v > 0.2068965 ? Math.pow(v, 3) : (v - 4 / 29) * (108 / 841);
}

/**
 * @param {number} v Input value.
 * @return {number} Output value.
 */
function a1(v) {
  return v > 10.314724 ? Math.pow((v + 14.025) / 269.025, 2.4) : v / 3294.6;
}

/**
 * @param {number} v Input value.
 * @return {number} Output value.
 */
function a2(v) {
  return v > 0.0088564 ? Math.pow(v, 1 / 3) : v / (108 / 841) + 4 / 29;
}

/**
 * @param {Color} color RGBA color.
 * @return {Color} LCHuv color with alpha.
 */
export function rgbaToLcha(color) {
  const r = a1(color[0]);
  const g = a1(color[1]);
  const b = a1(color[2]);
  const y = a2(r * 0.222488403 + g * 0.716873169 + b * 0.06060791);
  const l = 500 * (a2(r * 0.452247074 + g * 0.399439023 + b * 0.148375274) - y);
  const q = 200 * (y - a2(r * 0.016863605 + g * 0.117638439 + b * 0.865350722));
  const h = Math.atan2(q, l) * (180 / Math.PI);
  return [
    116 * y - 16,
    Math.sqrt(l * l + q * q),
    h < 0 ? h + 360 : h,
    color[3],
  ];
}

/**
 * @param {Color} color LCHuv color with alpha.
 * @return {Color} RGBA color.
 */
export function lchaToRgba(color) {
  const l = (color[0] + 16) / 116;
  const c = color[1];
  const h = (color[2] * Math.PI) / 180;
  const y = b2(l);
  const x = b2(l + (c / 500) * Math.cos(h));
  const z = b2(l - (c / 200) * Math.sin(h));
  const r = b1(x * 3.021973625 - y * 1.617392459 - z * 0.404875592);
  const g = b1(x * -0.943766287 + y * 1.916279586 + z * 0.027607165);
  const b = b1(x * 0.069407491 - y * 0.22898585 + z * 1.159737864);
  return [
    clamp((r + 0.5) | 0, 0, 255),
    clamp((g + 0.5) | 0, 0, 255),
    clamp((b + 0.5) | 0, 0, 255),
    color[3],
  ];
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
    throwInvalidColor(s);
  }
  for (const c of color) {
    if (isNaN(c)) {
      throwInvalidColor(s);
    }
  }
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
