goog.provide('ol.render.canvas');


goog.require('ol.css');
goog.require('ol.dom');
goog.require('ol.obj');
goog.require('ol.structs.LRUCache');
goog.require('ol.transform');


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultFont = '10px sans-serif';


/**
 * @const
 * @type {ol.Color}
 */
ol.render.canvas.defaultFillStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultLineCap = 'round';


/**
 * @const
 * @type {Array.<number>}
 */
ol.render.canvas.defaultLineDash = [];


/**
 * @const
 * @type {number}
 */
ol.render.canvas.defaultLineDashOffset = 0;


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
ol.render.canvas.defaultMiterLimit = 10;


/**
 * @const
 * @type {ol.Color}
 */
ol.render.canvas.defaultStrokeStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultTextAlign = 'center';


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultTextBaseline = 'middle';


/**
 * @const
 * @type {Array.<number>}
 */
ol.render.canvas.defaultPadding = [0, 0, 0, 0];


/**
 * @const
 * @type {number}
 */
ol.render.canvas.defaultLineWidth = 1;


/**
 * @type {ol.structs.LRUCache.<HTMLCanvasElement>}
 */
ol.render.canvas.labelCache = new ol.structs.LRUCache();


/**
 * @type {!Object.<string, number>}
 */
ol.render.canvas.checkedFonts_ = {};


/**
 * @type {CanvasRenderingContext2D}
 */
ol.render.canvas.measureContext_ = null;


/**
 * @type {!Object.<string, number>}
 */
ol.render.canvas.textHeights_ = {};


/**
 * Clears the label cache when a font becomes available.
 * @param {string} fontSpec CSS font spec.
 */
ol.render.canvas.checkFont = (function() {
  var retries = 60;
  var checked = ol.render.canvas.checkedFonts_;
  var labelCache = ol.render.canvas.labelCache;
  var font = '32px monospace';
  var text = 'wmytzilWMYTZIL@#/&?$%10';
  var interval, referenceWidth;

  function isAvailable(fontFamily) {
    var context = ol.render.canvas.getMeasureContext();
    context.font = font;
    referenceWidth = context.measureText(text).width;
    var available = true;
    if (fontFamily != 'monospace') {
      context.font = '32px ' + fontFamily + ',monospace';
      var width = context.measureText(text).width;
      // If width and referenceWidth are the same, then the 'monospace'
      // fallback was used instead of the font we wanted, so the font is not
      // available.
      available = width != referenceWidth;
    }
    return available;
  }

  function check() {
    var done = true;
    for (var font in checked) {
      if (checked[font] < retries) {
        if (isAvailable(font)) {
          checked[font] = retries;
          ol.obj.clear(ol.render.canvas.textHeights_);
          // Make sure that loaded fonts are picked up by Safari
          ol.render.canvas.measureContext_ = null;
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
    var fontFamilies = ol.css.getFontFamilies(fontSpec);
    if (!fontFamilies) {
      return;
    }
    for (var i = 0, ii = fontFamilies.length; i < ii; ++i) {
      var fontFamily = fontFamilies[i];
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
ol.render.canvas.getMeasureContext = function() {
  var context = ol.render.canvas.measureContext_;
  if (!context) {
    context = ol.render.canvas.measureContext_ = ol.dom.createCanvasContext2D(1, 1);
  }
  return context;
};


/**
 * @param {string} font Font to use for measuring.
 * @return {ol.Size} Measurement.
 */
ol.render.canvas.measureTextHeight = (function() {
  var span;
  var heights = ol.render.canvas.textHeights_;
  return function(font) {
    var height = heights[font];
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
ol.render.canvas.measureTextWidth = function(font, text) {
  var measureContext = ol.render.canvas.getMeasureContext();
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
ol.render.canvas.rotateAtOffset = function(context, rotation, offsetX, offsetY) {
  if (rotation !== 0) {
    context.translate(offsetX, offsetY);
    context.rotate(rotation);
    context.translate(-offsetX, -offsetY);
  }
};


ol.render.canvas.resetTransform_ = ol.transform.create();


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
ol.render.canvas.drawImage = function(context,
    transform, opacity, image, originX, originY, w, h, x, y, scale) {
  var alpha;
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
    context.setTransform.apply(context, ol.render.canvas.resetTransform_);
  }
};
