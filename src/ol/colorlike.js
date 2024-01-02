/**
 * @module ol/colorlike
 */
import ImageState from './ImageState.js';
import {createCanvasContext2D} from './dom.js';
import {get as getIconImage} from './style/IconImage.js';
import {shared as iconCache} from './style/IconImageCache.js';
import {toString} from './color.js';

/**
 * @typedef {Object} PatternDescriptor
 * @property {string} src Pattern image URL
 * @property {import("./color.js").Color|string} [color] Color to tint the pattern with.
 * @property {import("./size.js").Size} [size] Size of the desired slice from the pattern image.
 * Use this together with `offset` when the pattern image is a sprite sheet.
 * @property {import("./size.js").Size} [offset] Offset of the desired slice from the pattern image.
 * Use this together with `size` when the pattern image is a sprite sheet.
 */

/**
 * A type accepted by CanvasRenderingContext2D.fillStyle
 * or CanvasRenderingContext2D.strokeStyle.
 * Represents a color, [CanvasPattern](https://developer.mozilla.org/en-US/docs/Web/API/CanvasPattern),
 * or [CanvasGradient](https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient). The origin for
 * patterns and gradients as fill style is an increment of 512 css pixels from map coordinate
 * `[0, 0]`. For seamless repeat patterns, width and height of the pattern image
 * must be a factor of two (2, 4, 8, ..., 512).
 *
 * @typedef {string|CanvasPattern|CanvasGradient} ColorLike
 * @api
 */

/**
 * @param {import("./color.js").Color|ColorLike|PatternDescriptor|null} color Color.
 * @return {ColorLike|null} The color as an {@link ol/colorlike~ColorLike}.
 * @api
 */
export function asColorLike(color) {
  if (!color) {
    return null;
  }
  if (Array.isArray(color)) {
    return toString(color);
  }
  if (typeof color === 'object' && 'src' in color) {
    return asCanvasPattern(color);
  }
  return color;
}

/**
 * @param {PatternDescriptor} pattern Pattern descriptor.
 * @return {CanvasPattern|null} Canvas pattern or null if the pattern referenced in the
 * PatternDescriptor was not found in the icon image cache.
 */
function asCanvasPattern(pattern) {
  if (!pattern.offset || !pattern.size) {
    return iconCache.getPattern(pattern.src, 'anonymous', pattern.color);
  }

  const cacheKey = pattern.src + ':' + pattern.offset;

  const canvasPattern = iconCache.getPattern(
    cacheKey,
    undefined,
    pattern.color,
  );
  if (canvasPattern) {
    return canvasPattern;
  }

  const iconImage = iconCache.get(pattern.src, 'anonymous', null);
  if (iconImage.getImageState() !== ImageState.LOADED) {
    return null;
  }
  const patternCanvasContext = createCanvasContext2D(
    pattern.size[0],
    pattern.size[1],
  );
  patternCanvasContext.drawImage(
    iconImage.getImage(1),
    pattern.offset[0],
    pattern.offset[1],
    pattern.size[0],
    pattern.size[1],
    0,
    0,
    pattern.size[0],
    pattern.size[1],
  );
  getIconImage(
    patternCanvasContext.canvas,
    cacheKey,
    undefined,
    ImageState.LOADED,
    pattern.color,
    true,
  );
  return iconCache.getPattern(cacheKey, undefined, pattern.color);
}
