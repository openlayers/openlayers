/**
 * @module ol/render/canvas
 */
import {getFontFamilies} from '../css.js';
import {createCanvasContext2D} from '../dom.js';
import {clear} from '../obj.js';
import LRUCache from '../structs/LRUCache.js';
import _ol_transform_ from '../transform.js';
const _ol_render_canvas_ = {};


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultFont = '10px sans-serif';


/**
 * @const
 * @type {ol.Color}
 */
_ol_render_canvas_.defaultFillStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultLineCap = 'round';


/**
 * @const
 * @type {Array.<number>}
 */
_ol_render_canvas_.defaultLineDash = [];


/**
 * @const
 * @type {number}
 */
_ol_render_canvas_.defaultLineDashOffset = 0;


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
_ol_render_canvas_.defaultMiterLimit = 10;


/**
 * @const
 * @type {ol.Color}
 */
_ol_render_canvas_.defaultStrokeStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultTextAlign = 'center';


/**
 * @const
 * @type {string}
 */
_ol_render_canvas_.defaultTextBaseline = 'middle';


/**
 * @const
 * @type {Array.<number>}
 */
_ol_render_canvas_.defaultPadding = [0, 0, 0, 0];


/**
 * @const
 * @type {number}
 */
_ol_render_canvas_.defaultLineWidth = 1;


/**
 * @type {ol.structs.LRUCache.<HTMLCanvasElement>}
 */
_ol_render_canvas_.labelCache = new LRUCache();


/**
 * @type {!Object.<string, number>}
 */
_ol_render_canvas_.checkedFonts_ = {};


/**
 * @type {CanvasRenderingContext2D}
 */
_ol_render_canvas_.measureContext_ = null;


/**
 * @type {!Object.<string, number>}
 */
_ol_render_canvas_.textHeights_ = {};


/**
 * Clears the label cache when a font becomes available.
 * @param {string} fontSpec CSS font spec.
 */
_ol_render_canvas_.checkFont = (function() {
  const retries = 60;
  const checked = _ol_render_canvas_.checkedFonts_;
  const labelCache = _ol_render_canvas_.labelCache;
  const size = '32px ';
  const referenceFonts = ['monospace', 'serif'];
  const len = referenceFonts.length;
  const text = 'wmytzilWMYTZIL@#/&?$%10';
  let interval, referenceWidth;

  function isAvailable(font) {
    const context = _ol_render_canvas_.getMeasureContext();
    let available = true;
    for (let i = 0; i < len; ++i) {
      const referenceFont = referenceFonts[i];
      context.font = size + referenceFont;
      referenceWidth = context.measureText(text).width;
      if (font != referenceFont) {
        context.font = size + font + ',' + referenceFont;
        const width = context.measureText(text).width;
        // If width and referenceWidth are the same, then the fallback was used
        // instead of the font we wanted, so the font is not available.
        available = available && width != referenceWidth;
      }
    }
    return available;
  }

  function check() {
    let done = true;
    for (const font in checked) {
      if (checked[font] < retries) {
        if (isAvailable(font)) {
          checked[font] = retries;
          clear(_ol_render_canvas_.textHeights_);
          // Make sure that loaded fonts are picked up by Safari
          _ol_render_canvas_.measureContext_ = null;
          labelCache.clear();
        } else {
          ++checked[font];
          done = false;
        }
      }
    }
    if (done) {
      window.clearInterval(interval);
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
            interval = window.setInterval(check, 32);
          }
        }
      }
    }
  };
})();


/**
 * @return {CanvasRenderingContext2D} Measure context.
 */
_ol_render_canvas_.getMeasureContext = function() {
  let context = _ol_render_canvas_.measureContext_;
  if (!context) {
    context = _ol_render_canvas_.measureContext_ = createCanvasContext2D(1, 1);
  }
  return context;
};


/**
 * @param {string} font Font to use for measuring.
 * @return {ol.Size} Measurement.
 */
_ol_render_canvas_.measureTextHeight = (function() {
  let span;
  const heights = _ol_render_canvas_.textHeights_;
  return function(font) {
    let height = heights[font];
    if (height == undefined) {
      if (!span) {
        span = document.createElement('span');
        span.textContent = 'M';
        span.style.margin = span.style.padding = '0 !important';
        span.style.position = 'absolute !important';
        span.style.left = '-99999px !important';
      }
      span.style.font = font;
      document.body.appendChild(span);
      height = heights[font] = span.offsetHeight;
      document.body.removeChild(span);
    }
    return height;
  };
})();


/**
 * @param {string} font Font.
 * @param {string} text Text.
 * @return {number} Width.
 */
_ol_render_canvas_.measureTextWidth = function(font, text) {
  const measureContext = _ol_render_canvas_.getMeasureContext();
  if (font != measureContext.font) {
    measureContext.font = font;
  }
  return measureContext.measureText(text).width;
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} rotation Rotation.
 * @param {number} offsetX X offset.
 * @param {number} offsetY Y offset.
 */
_ol_render_canvas_.rotateAtOffset = function(context, rotation, offsetX, offsetY) {
  if (rotation !== 0) {
    context.translate(offsetX, offsetY);
    context.rotate(rotation);
    context.translate(-offsetX, -offsetY);
  }
};


_ol_render_canvas_.resetTransform_ = _ol_transform_.create();


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Transform|null} transform Transform.
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
_ol_render_canvas_.drawImage = function(context,
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
    context.setTransform.apply(context, _ol_render_canvas_.resetTransform_);
  }
};
export default _ol_render_canvas_;
