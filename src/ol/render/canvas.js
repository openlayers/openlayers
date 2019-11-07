/**
 * @module ol/render/canvas
 */
import {getFontParameters} from '../css.js';
import {createCanvasContext2D} from '../dom.js';
import {clear} from '../obj.js';
import {create as createTransform} from '../transform.js';
import LabelCache from './canvas/LabelCache.js';


/**
 * @typedef {Object} FillState
 * @property {import("../colorlike.js").ColorLike} fillStyle
 */


/**
 * @typedef {Object} FillStrokeState
 * @property {import("../colorlike.js").ColorLike} [currentFillStyle]
 * @property {import("../colorlike.js").ColorLike} [currentStrokeStyle]
 * @property {CanvasLineCap} [currentLineCap]
 * @property {Array<number>} currentLineDash
 * @property {number} [currentLineDashOffset]
 * @property {CanvasLineJoin} [currentLineJoin]
 * @property {number} [currentLineWidth]
 * @property {number} [currentMiterLimit]
 * @property {number} [lastStroke]
 * @property {import("../colorlike.js").ColorLike} [fillStyle]
 * @property {import("../colorlike.js").ColorLike} [strokeStyle]
 * @property {CanvasLineCap} [lineCap]
 * @property {Array<number>} lineDash
 * @property {number} [lineDashOffset]
 * @property {CanvasLineJoin} [lineJoin]
 * @property {number} [lineWidth]
 * @property {number} [miterLimit]
 */


/**
 * @typedef {Object} StrokeState
 * @property {CanvasLineCap} lineCap
 * @property {Array<number>} lineDash
 * @property {number} lineDashOffset
 * @property {CanvasLineJoin} lineJoin
 * @property {number} lineWidth
 * @property {number} miterLimit
 * @property {import("../colorlike.js").ColorLike} strokeStyle
 */


/**
 * @typedef {Object} TextState
 * @property {string} font
 * @property {string} [textAlign]
 * @property {string} textBaseline
 * @property {string} [placement]
 * @property {number} [maxAngle]
 * @property {boolean} [overflow]
 * @property {import("../style/Fill.js").default} [backgroundFill]
 * @property {import("../style/Stroke.js").default} [backgroundStroke]
 * @property {number} [scale]
 * @property {Array<number>} [padding]
 */

/**
 * Container for decluttered replay instructions that need to be rendered or
 * omitted together, i.e. when styles render both an image and text, or for the
 * characters that form text along lines. The basic elements of this array are
 * `[minX, minY, maxX, maxY, count]`, where the first four entries are the
 * rendered extent of the group in pixel space. `count` is the number of styles
 * in the group, i.e. 2 when an image and a text are grouped, or 1 otherwise.
 * In addition to these four elements, declutter instruction arrays (i.e. the
 * arguments to {@link module:ol/render/canvas~drawImage} are appended to the array.
 * @typedef {Array<*>} DeclutterGroup
 */


/**
 * Declutter groups for support of multi geometries.
 * @typedef {Array<DeclutterGroup>} DeclutterGroups
 */


/**
 * @const
 * @type {string}
 */
export const defaultFont = '10px sans-serif';


/**
 * @const
 * @type {import("../colorlike.js").ColorLike}
 */
export const defaultFillStyle = '#000';


/**
 * @const
 * @type {CanvasLineCap}
 */
export const defaultLineCap = 'round';


/**
 * @const
 * @type {Array<number>}
 */
export const defaultLineDash = [];


/**
 * @const
 * @type {number}
 */
export const defaultLineDashOffset = 0;


/**
 * @const
 * @type {CanvasLineJoin}
 */
export const defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
export const defaultMiterLimit = 10;


/**
 * @const
 * @type {import("../colorlike.js").ColorLike}
 */
export const defaultStrokeStyle = '#000';


/**
 * @const
 * @type {string}
 */
export const defaultTextAlign = 'center';


/**
 * @const
 * @type {string}
 */
export const defaultTextBaseline = 'middle';


/**
 * @const
 * @type {Array<number>}
 */
export const defaultPadding = [0, 0, 0, 0];


/**
 * @const
 * @type {number}
 */
export const defaultLineWidth = 1;


/**
 * The label cache for text rendering. To change the default cache size of 2048
 * entries, use {@link module:ol/structs/LRUCache#setSize}.
 * @type {LabelCache}
 * @api
 */
export const labelCache = new LabelCache();


/**
 * @type {!Object<string, number>}
 */
export const checkedFonts = {};


/**
 * @type {CanvasRenderingContext2D}
 */
let measureContext = null;

/**
 * @type {string}
 */
let measureFont;

/**
 * @type {!Object<string, number>}
 */
export const textHeights = {};


/**
 * Clears the label cache when a font becomes available.
 * @param {string} fontSpec CSS font spec.
 */
export const checkFont = (function() {
  const retries = 100;
  const checked = checkedFonts;
  const size = '32px ';
  const referenceFonts = ['monospace', 'serif'];
  const len = referenceFonts.length;
  const text = 'wmytzilWMYTZIL@#/&?$%10\uF013';
  let interval, referenceWidth;

  /**
   * @param {string} fontStyle Css font-style
   * @param {string} fontWeight Css font-weight
   * @param {*} fontFamily Css font-family
   * @return {boolean} Font with style and weight is available
   */
  function isAvailable(fontStyle, fontWeight, fontFamily) {
    let available = true;
    for (let i = 0; i < len; ++i) {
      const referenceFont = referenceFonts[i];
      referenceWidth = measureTextWidth(fontStyle + ' ' + fontWeight + ' ' + size + referenceFont, text);
      if (fontFamily != referenceFont) {
        const width = measureTextWidth(fontStyle + ' ' + fontWeight + ' ' + size + fontFamily + ',' + referenceFont, text);
        // If width and referenceWidth are the same, then the fallback was used
        // instead of the font we wanted, so the font is not available.
        available = available && width != referenceWidth;
      }
    }
    if (available) {
      return true;
    }
    return false;
  }

  function check() {
    let done = true;
    for (const font in checked) {
      if (checked[font] < retries) {
        if (isAvailable.apply(this, font.split('\n'))) {
          checked[font] = retries;
          clear(textHeights);
          // Make sure that loaded fonts are picked up by Safari
          measureContext = null;
          measureFont = undefined;
          if (labelCache.getCount()) {
            labelCache.clear();
          }
        } else {
          ++checked[font];
          done = false;
        }
      }
    }
    if (done) {
      clearInterval(interval);
      interval = undefined;
    }
  }

  return function(fontSpec) {
    const font = getFontParameters(fontSpec);
    if (!font) {
      return;
    }
    const families = font.families;
    for (let i = 0, ii = families.length; i < ii; ++i) {
      const family = families[i];
      const key = font.style + '\n' + font.weight + '\n' + family;
      if (!(key in checked)) {
        checked[key] = retries;
        if (!isAvailable(font.style, font.weight, family)) {
          checked[key] = 0;
          if (interval === undefined) {
            interval = setInterval(check, 32);
          }
        }
      }
    }
  };
})();


/**
 * @param {string} font Font to use for measuring.
 * @return {import("../size.js").Size} Measurement.
 */
export const measureTextHeight = (function() {
  /**
   * @type {HTMLDivElement}
   */
  let div;
  const heights = textHeights;
  return function(font) {
    let height = heights[font];
    if (height == undefined) {
      if (!div) {
        div = document.createElement('div');
        div.innerHTML = 'M';
        div.style.margin = '0 !important';
        div.style.padding = '0 !important';
        div.style.position = 'absolute !important';
        div.style.left = '-99999px !important';
      }
      div.style.font = font;
      document.body.appendChild(div);
      height = div.offsetHeight;
      heights[font] = height;
      document.body.removeChild(div);
    }
    return height;
  };
})();


/**
 * @param {string} font Font.
 * @param {string} text Text.
 * @return {number} Width.
 */
export function measureTextWidth(font, text) {
  if (!measureContext) {
    measureContext = createCanvasContext2D(1, 1);
  }
  if (font != measureFont) {
    measureContext.font = font;
    measureFont = measureContext.font;
  }
  return measureContext.measureText(text).width;
}


/**
 * Measure text width using a cache.
 * @param {string} font The font.
 * @param {string} text The text to measure.
 * @param {Object<string, number>} cache A lookup of cached widths by text.
 * @returns {number} The text width.
 */
export function measureAndCacheTextWidth(font, text, cache) {
  if (text in cache) {
    return cache[text];
  }
  const width = measureTextWidth(font, text);
  cache[text] = width;
  return width;
}


/**
 * @param {string} font Font to use for measuring.
 * @param {Array<string>} lines Lines to measure.
 * @param {Array<number>} widths Array will be populated with the widths of
 * each line.
 * @return {number} Width of the whole text.
 */
export function measureTextWidths(font, lines, widths) {
  const numLines = lines.length;
  let width = 0;
  for (let i = 0; i < numLines; ++i) {
    const currentWidth = measureTextWidth(font, lines[i]);
    width = Math.max(width, currentWidth);
    widths.push(currentWidth);
  }
  return width;
}


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} rotation Rotation.
 * @param {number} offsetX X offset.
 * @param {number} offsetY Y offset.
 */
export function rotateAtOffset(context, rotation, offsetX, offsetY) {
  if (rotation !== 0) {
    context.translate(offsetX, offsetY);
    context.rotate(rotation);
    context.translate(-offsetX, -offsetY);
  }
}


export const resetTransform = createTransform();


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {import("../transform.js").Transform|null} transform Transform.
 * @param {number} opacity Opacity.
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} image Image.
 * @param {number} originX Origin X.
 * @param {number} originY Origin Y.
 * @param {number} w Width.
 * @param {number} h Height.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} scale Scale.
 */
export function drawImage(context,
  transform, opacity, image, originX, originY, w, h, x, y, scale) {
  let alpha;
  if (opacity != 1) {
    alpha = context.globalAlpha;
    context.globalAlpha = alpha * opacity;
  }
  if (transform) {
    context.setTransform.apply(context, transform);
  }

  context.drawImage(image, originX, originY, w, h, x, y, w * scale, h * scale);

  if (opacity != 1) {
    context.globalAlpha = alpha;
  }
  if (transform) {
    context.setTransform.apply(context, resetTransform);
  }
}
