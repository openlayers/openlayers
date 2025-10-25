/**
 * @module ol/render/canvas
 */
import BaseObject from '../Object.js';
import {fontWeights, getFontParameters} from '../css.js';
import {createCanvasContext2D} from '../dom.js';
import {WORKER_OFFSCREEN_CANVAS} from '../has.js';
import {clear} from '../obj.js';

/**
 * @typedef {'Circle' | 'Image' | 'LineString' | 'Polygon' | 'Text' | 'Default'} BuilderType
 */

/**
 * @typedef {Object} FillState
 * @property {import("../colorlike.js").ColorLike} fillStyle FillStyle.
 */

/**
 * @typedef Label
 * @property {number} width Width.
 * @property {number} height Height.
 * @property {Array<string|number>} contextInstructions ContextInstructions.
 */

/**
 * @typedef {Object} FillStrokeState
 * @property {import("../colorlike.js").ColorLike} [currentFillStyle] Current FillStyle.
 * @property {import("../colorlike.js").ColorLike} [currentStrokeStyle] Current StrokeStyle.
 * @property {CanvasLineCap} [currentLineCap] Current LineCap.
 * @property {Array<number>} currentLineDash Current LineDash.
 * @property {number} [currentLineDashOffset] Current LineDashOffset.
 * @property {CanvasLineJoin} [currentLineJoin] Current LineJoin.
 * @property {number} [currentLineWidth] Current LineWidth.
 * @property {number} [currentMiterLimit] Current MiterLimit.
 * @property {number} [lastStroke] Last stroke.
 * @property {import("../colorlike.js").ColorLike} [fillStyle] FillStyle.
 * @property {import("../colorlike.js").ColorLike} [strokeStyle] StrokeStyle.
 * @property {CanvasLineCap} [lineCap] LineCap.
 * @property {Array<number>} lineDash LineDash.
 * @property {number} [lineDashOffset] LineDashOffset.
 * @property {CanvasLineJoin} [lineJoin] LineJoin.
 * @property {number} [lineWidth] LineWidth.
 * @property {number} [miterLimit] MiterLimit.
 * @property {number} [fillPatternScale] Fill pattern scale.
 */

/**
 * @typedef {Object} StrokeState
 * @property {CanvasLineCap} lineCap LineCap.
 * @property {Array<number>} lineDash LineDash.
 * @property {number} lineDashOffset LineDashOffset.
 * @property {CanvasLineJoin} lineJoin LineJoin.
 * @property {number} lineWidth LineWidth.
 * @property {number} miterLimit MiterLimit.
 * @property {import("../colorlike.js").ColorLike} strokeStyle StrokeStyle.
 */

/**
 * @typedef {Object} TextState
 * @property {string} font Font.
 * @property {CanvasTextAlign} [textAlign] TextAlign.
 * @property {number} [repeat] Repeat.
 * @property {import("../style/Text.js").TextJustify} [justify] Justify.
 * @property {CanvasTextBaseline} textBaseline TextBaseline.
 * @property {import("../style/Text.js").TextPlacement} [placement] Placement.
 * @property {number} [maxAngle] MaxAngle.
 * @property {boolean} [overflow] Overflow.
 * @property {import("../style/Fill.js").default} [backgroundFill] BackgroundFill.
 * @property {import("../style/Stroke.js").default} [backgroundStroke] BackgroundStroke.
 * @property {import("../size.js").Size} [scale] Scale.
 * @property {Array<number>} [padding] Padding.
 */

/**
 * @typedef {Object} SerializableInstructions
 * @property {Array<*>} instructions The rendering instructions.
 * @property {Array<*>} hitDetectionInstructions The rendering hit detection instructions.
 * @property {Array<number>} coordinates The array of all coordinates.
 * @property {!Object<string, TextState>} [textStates] The text states (decluttering).
 * @property {!Object<string, FillState>} [fillStates] The fill states (decluttering).
 * @property {!Object<string, StrokeState>} [strokeStates] The stroke states (decluttering).
 */

/**
 * @typedef {Object<number, import("./canvas/Executor.js").ReplayImageOrLabelArgs>} DeclutterImageWithText
 */

/**
 * @const
 * @type {string}
 */
export const defaultFont = '10px sans-serif';

/**
 * @const
 * @type {string}
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
 * @type {CanvasTextAlign}
 */
export const defaultTextAlign = 'center';

/**
 * @const
 * @type {CanvasTextBaseline}
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
 * @type {BaseObject}
 */
export const checkedFonts = new BaseObject();

/**
 * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D}
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

const genericFontFamilies = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong',
]);

/**
 * @param {string} style Css font-style
 * @param {string} weight Css font-weight
 * @param {string} family Css font-family
 * @return {string} Font key.
 */
function getFontKey(style, weight, family) {
  return `${style} ${weight} 16px "${family}"`;
}

/**
 * Clears the label cache when a font becomes available.
 * @param {string} fontSpec CSS font spec.
 */
export const registerFont = (function () {
  const retries = 100;
  let timeout, fontFaceSet;

  /**
   * @param {string} fontSpec Css font spec
   * @return {Promise<boolean>} Font with style and weight is available
   */
  async function isAvailable(fontSpec) {
    await fontFaceSet.ready;
    const fontFaces = await fontFaceSet.load(fontSpec);
    if (fontFaces.length === 0) {
      return false;
    }
    const font = getFontParameters(fontSpec);
    const checkFamily = font.families[0].toLowerCase();
    const checkWeight = font.weight;
    return fontFaces.some(
      /**
       * @param {import('../css.js').FontParameters} f Font.
       * @return {boolean} Font matches.
       */
      (f) => {
        const family = f.family.replace(/^['"]|['"]$/g, '').toLowerCase();
        const weight = fontWeights[f.weight] || f.weight;
        return (
          family === checkFamily &&
          f.style === font.style &&
          weight == checkWeight
        );
      },
    );
  }

  async function check() {
    await fontFaceSet.ready;
    let done = true;
    const checkedFontsProperties = checkedFonts.getProperties();
    const fonts = Object.keys(checkedFontsProperties).filter(
      (key) => checkedFontsProperties[key] < retries,
    );
    for (let i = fonts.length - 1; i >= 0; --i) {
      const font = fonts[i];
      let currentRetries = checkedFontsProperties[font];
      if (currentRetries < retries) {
        if (await isAvailable(font)) {
          clear(textHeights);
          checkedFonts.set(font, retries);
        } else {
          currentRetries += 10;
          checkedFonts.set(font, currentRetries, true);
          if (currentRetries < retries) {
            done = false;
          }
        }
      }
    }
    timeout = undefined;
    if (!done) {
      timeout = setTimeout(check, 100);
    }
  }

  return async function (fontSpec) {
    if (!fontFaceSet) {
      fontFaceSet = WORKER_OFFSCREEN_CANVAS ? self.fonts : document.fonts;
    }
    const font = getFontParameters(fontSpec);
    if (!font) {
      return;
    }
    const families = font.families;
    let needCheck = false;
    for (const family of families) {
      if (genericFontFamilies.has(family)) {
        continue;
      }
      const key = getFontKey(font.style, font.weight, family);
      if (checkedFonts.get(key) !== undefined) {
        continue;
      }
      checkedFonts.set(key, 0, true);
      needCheck = true;
    }
    if (needCheck) {
      clearTimeout(timeout);
      timeout = setTimeout(check, 100);
    }
  };
})();

/**
 * @param {string} font Font to use for measuring.
 * @return {import("../size.js").Size} Measurement.
 */
export const measureTextHeight = (function () {
  /**
   * @type {HTMLDivElement}
   */
  let measureElement;
  return function (fontSpec) {
    let height = textHeights[fontSpec];
    if (height == undefined) {
      if (WORKER_OFFSCREEN_CANVAS) {
        const font = getFontParameters(fontSpec);
        const metrics = measureText(fontSpec, 'Žg');
        const lineHeight = isNaN(Number(font.lineHeight))
          ? 1.2
          : Number(font.lineHeight);
        height =
          lineHeight *
          (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
      } else {
        if (!measureElement) {
          measureElement = document.createElement('div');
          measureElement.innerHTML = 'M';
          measureElement.style.minHeight = '0';
          measureElement.style.maxHeight = 'none';
          measureElement.style.height = 'auto';
          measureElement.style.padding = '0';
          measureElement.style.border = 'none';
          measureElement.style.position = 'absolute';
          measureElement.style.display = 'block';
          measureElement.style.left = '-99999px';
        }
        measureElement.style.font = fontSpec;
        document.body.appendChild(measureElement);
        height = measureElement.offsetHeight;
        document.body.removeChild(measureElement);
      }
      textHeights[fontSpec] = height;
    }
    return height;
  };
})();

/**
 * @param {string} font Font.
 * @param {string} text Text.
 * @return {TextMetrics} Text metrics.
 */
function measureText(font, text) {
  if (!measureContext) {
    measureContext = createCanvasContext2D(1, 1);
  }
  if (font != measureFont) {
    measureContext.font = font;
    measureFont = measureContext.font;
  }
  return measureContext.measureText(text);
}

/**
 * @param {string} font Font.
 * @param {string} text Text.
 * @return {number} Width.
 */
export function measureTextWidth(font, text) {
  return measureText(font, text).width;
}

/**
 * Measure text width using a cache.
 * @param {string} font The font.
 * @param {string} text The text to measure.
 * @param {Object<string, number>} cache A lookup of cached widths by text.
 * @return {number} The text width.
 */
export function measureAndCacheTextWidth(font, text, cache) {
  if (text in cache) {
    return cache[text];
  }
  const width = text
    .split('\n')
    .reduce((prev, curr) => Math.max(prev, measureTextWidth(font, curr)), 0);
  cache[text] = width;
  return width;
}

/**
 * @param {TextState} baseStyle Base style.
 * @param {Array<string>} chunks Text chunks to measure.
 * @return {{width: number, height: number, widths: Array<number>, heights: Array<number>, lineWidths: Array<number>}}} Text metrics.
 */
export function getTextDimensions(baseStyle, chunks) {
  const widths = [];
  const heights = [];
  const lineWidths = [];
  let width = 0;
  let lineWidth = 0;
  let height = 0;
  let lineHeight = 0;
  for (let i = 0, ii = chunks.length; i <= ii; i += 2) {
    const text = chunks[i];
    if (text === '\n' || i === ii) {
      width = Math.max(width, lineWidth);
      lineWidths.push(lineWidth);
      lineWidth = 0;
      height += lineHeight;
      lineHeight = 0;
      continue;
    }
    const font = chunks[i + 1] || baseStyle.font;
    const currentWidth = measureTextWidth(font, text);
    widths.push(currentWidth);
    lineWidth += currentWidth;
    const currentHeight = measureTextHeight(font);
    heights.push(currentHeight);
    lineHeight = Math.max(lineHeight, currentHeight);
  }
  return {width, height, widths, heights, lineWidths};
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

/**
 * @param {CanvasRenderingContext2D|import("../render/canvas/ZIndexContext.js").ZIndexContextProxy} context Context.
 * @param {import("../transform.js").Transform|null} transform Transform.
 * @param {number} opacity Opacity.
 * @param {Label|HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} labelOrImage Label.
 * @param {number} originX Origin X.
 * @param {number} originY Origin Y.
 * @param {number} w Width.
 * @param {number} h Height.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {import("../size.js").Size} scale Scale.
 */
export function drawImageOrLabel(
  context,
  transform,
  opacity,
  labelOrImage,
  originX,
  originY,
  w,
  h,
  x,
  y,
  scale,
) {
  context.save();

  if (opacity !== 1) {
    if (context.globalAlpha === undefined) {
      context.globalAlpha = (context) => (context.globalAlpha *= opacity);
    } else {
      context.globalAlpha *= opacity;
    }
  }
  if (transform) {
    context.transform.apply(context, transform);
  }

  if (/** @type {*} */ (labelOrImage).contextInstructions) {
    // label
    context.translate(x, y);
    context.scale(scale[0], scale[1]);
    executeLabelInstructions(/** @type {Label} */ (labelOrImage), context);
  } else if (scale[0] < 0 || scale[1] < 0) {
    // flipped image
    context.translate(x, y);
    context.scale(scale[0], scale[1]);
    context.drawImage(
      /** @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} */ (
        labelOrImage
      ),
      originX,
      originY,
      w,
      h,
      0,
      0,
      w,
      h,
    );
  } else {
    // if image not flipped translate and scale can be avoided
    context.drawImage(
      /** @type {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} */ (
        labelOrImage
      ),
      originX,
      originY,
      w,
      h,
      x,
      y,
      w * scale[0],
      h * scale[1],
    );
  }

  context.restore();
}

/**
 * @param {Label} label Label.
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} context Context.
 */
function executeLabelInstructions(label, context) {
  const contextInstructions = label.contextInstructions;
  for (let i = 0, ii = contextInstructions.length; i < ii; i += 2) {
    if (Array.isArray(contextInstructions[i + 1])) {
      context[contextInstructions[i]].apply(
        context,
        contextInstructions[i + 1],
      );
    } else {
      context[contextInstructions[i]] = contextInstructions[i + 1];
    }
  }
}
