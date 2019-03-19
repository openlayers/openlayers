/**
 * @module ol/render/canvas
 */
import {getFontFamilies} from '../css.js';
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
 * @property {string} [currentLineCap]
 * @property {Array<number>} currentLineDash
 * @property {number} [currentLineDashOffset]
 * @property {string} [currentLineJoin]
 * @property {number} [currentLineWidth]
 * @property {number} [currentMiterLimit]
 * @property {number} [lastStroke]
 * @property {import("../colorlike.js").ColorLike} [fillStyle]
 * @property {import("../colorlike.js").ColorLike} [strokeStyle]
 * @property {string} [lineCap]
 * @property {Array<number>} lineDash
 * @property {number} [lineDashOffset]
 * @property {string} [lineJoin]
 * @property {number} [lineWidth]
 * @property {number} [miterLimit]
 */


/**
 * @typedef {Object} StrokeState
 * @property {string} lineCap
 * @property {Array<number>} lineDash
 * @property {number} lineDashOffset
 * @property {string} lineJoin
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
 * @type {string}
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
 * @type {string}
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
 * @type {!Object<string, number>}
 */
export const textHeights = {};


/**
 * Clears the label cache when a font becomes available.
 * @param {string} fontSpec CSS font spec.
 */
export const checkFont = (function() {
  const retries = 60;
  const checked = checkedFonts;
  const size = '32px ';
  const referenceFonts = ['monospace', 'serif'];
  const len = referenceFonts.length;
  const text = 'wmytzilWMYTZIL@#/&?$%10\uF013';
  let interval, referenceWidth;

  function isAvailable(font) {
    const context = getMeasureContext();
    // Check weight ranges according to
    // https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#Fallback_weights
    for (let weight = 100; weight <= 700; weight += 300) {
      const fontWeight = weight + ' ';
      let available = true;
      for (let i = 0; i < len; ++i) {
        const referenceFont = referenceFonts[i];
        context.font = fontWeight + size + referenceFont;
        referenceWidth = context.measureText(text).width;
        if (font != referenceFont) {
          context.font = fontWeight + size + font + ',' + referenceFont;
          const width = context.measureText(text).width;
          // If width and referenceWidth are the same, then the fallback was used
          // instead of the font we wanted, so the font is not available.
          available = available && width != referenceWidth;
        }
      }
      if (available) {
        // Consider font available when it is available in one weight range.
        //FIXME With this we miss rare corner cases, so we should consider
        //FIXME checking availability for each requested weight range.
        return true;
      }
    }
    return false;
  }

  function check() {
    let done = true;
    for (const font in checked) {
      if (checked[font] < retries) {
        if (isAvailable(font)) {
          checked[font] = retries;
          clear(textHeights);
          // Make sure that loaded fonts are picked up by Safari
          measureContext = null;
          labelCache.clear();
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
    const fontFamilies = getFontFamilies(fontSpec);
    if (!fontFamilies) {
      return;
    }
    for (let i = 0, ii = fontFamilies.length; i < ii; ++i) {
      const fontFamily = fontFamilies[i];
      if (!(fontFamily in checked)) {
        checked[fontFamily] = retries;
        if (!isAvailable(fontFamily)) {
          checked[fontFamily] = 0;
          if (interval === undefined) {
            interval = setInterval(check, 32);
          }
        }
      }
    }
  };
})();


/**
 * @return {CanvasRenderingContext2D} Measure context.
 */
function getMeasureContext() {
  if (!measureContext) {
    measureContext = createCanvasContext2D(1, 1);
  }
  return measureContext;
}


/**
 * @param {string} font Font to use for measuring.
 * @return {import("../size.js").Size} Measurement.
 */
export const measureTextHeight = (function() {
  let div;
  const heights = textHeights;
  return function(font) {
    let height = heights[font];
    if (height == undefined) {
      if (!div) {
        div = document.createElement('div');
        div.innerHTML = 'M';
        div.style.margin = div.style.padding = '0 !important';
        div.style.position = 'absolute !important';
        div.style.left = '-99999px !important';
      }
      div.style.font = font;
      document.body.appendChild(div);
      height = heights[font] = div.offsetHeight;
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
  const measureContext = getMeasureContext();
  if (font != measureContext.font) {
    measureContext.font = font;
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
  const width = cache[text] = measureTextWidth(font, text);
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

  if (alpha) {
    context.globalAlpha = alpha;
  }
  if (transform) {
    context.setTransform.apply(context, resetTransform);
  }
}
