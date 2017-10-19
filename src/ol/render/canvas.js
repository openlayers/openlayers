goog.provide('ol.render.canvas');


goog.require('ol.css');
goog.require('ol.dom');
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
 * @type {number}
 */
ol.render.canvas.defaultLineWidth = 1;


/**
 * @type {ol.structs.LRUCache.<HTMLCanvasElement>}
 */
ol.render.canvas.labelCache = new ol.structs.LRUCache();


/**
 * @type {!Object.<string, boolean>}
 */
ol.render.canvas.checkedFonts_ = {};


/**
 * Clears the label cache when a font becomes available.
 * @param {string} fontSpec CSS font spec.
 */
ol.render.canvas.checkFont = (function() {
  var checked = ol.render.canvas.checkedFonts_;
  var labelCache = ol.render.canvas.labelCache;
  var text = 'wmytzilWMYTZIL@#/&?$%10';
  var context, referenceWidth;

  function isAvailable(fontFamily) {
    if (!context) {
      context = ol.dom.createCanvasContext2D();
      context.font = '32px monospace';
      referenceWidth = context.measureText(text).width;
    }
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

  return function(fontSpec) {
    var fontFamilies = ol.css.getFontFamilies(fontSpec);
    if (!fontFamilies) {
      return;
    }
    fontFamilies.forEach(function(fontFamily) {
      if (!checked[fontFamily]) {
        checked[fontFamily] = true;
        if (!isAvailable(fontFamily)) {
          var callCount = 0;
          var interval = window.setInterval(function() {
            ++callCount;
            var available = isAvailable(fontFamily);
            if (available || callCount >= 60) {
              window.clearInterval(interval);
              if (available) {
                labelCache.clear();
              }
            }
          }, 25);
        }
      }
    });
  };
})();


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
