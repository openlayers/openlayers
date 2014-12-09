// We can't use goog.color or goog.color.alpha because they interally use a hex
// string representation that encodes each channel in a single byte.  This
// causes occasional loss of precision and rounding errors, especially in the
// alpha channel.

goog.provide('ol.color');

goog.require('goog.asserts');
goog.require('goog.color');
goog.require('goog.color.names');
goog.require('goog.math');
goog.require('goog.vec.Mat4');
goog.require('ol');


/**
 * A color represented as a short array [red, green, blue, alpha].
 * red, green, and blue should be integers in the range 0..255 inclusive.
 * alpha should be a float in the range 0..1 inclusive.
 * @typedef {Array.<number>}
 * @api
 */
ol.Color;


/**
 * This RegExp matches # followed by 3 or 6 hex digits.
 * @const
 * @type {RegExp}
 * @private
 */
ol.color.hexColorRe_ = /^#(?:[0-9a-f]{3}){1,2}$/i;


/**
 * @see goog.color.rgbColorRe_
 * @const
 * @type {RegExp}
 * @private
 */
ol.color.rgbColorRe_ =
    /^(?:rgb)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2})\)$/i;


/**
 * @see goog.color.alpha.rgbaColorRe_
 * @const
 * @type {RegExp}
 * @private
 */
ol.color.rgbaColorRe_ =
    /^(?:rgba)?\((0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|[1-9]\d{0,2}),\s?(0|1|0\.\d{0,10})\)$/i;


/**
 * @param {ol.Color} dst Destination.
 * @param {ol.Color} src Source.
 * @param {ol.Color=} opt_color Color.
 * @return {ol.Color} Color.
 */
ol.color.blend = function(dst, src, opt_color) {
  // http://en.wikipedia.org/wiki/Alpha_compositing
  // FIXME do we need to scale by 255?
  var out = goog.isDef(opt_color) ? opt_color : [];
  var dstA = dst[3];
  var srcA = dst[3];
  if (dstA == 1) {
    out[0] = (src[0] * srcA + dst[0] * (1 - srcA) + 0.5) | 0;
    out[1] = (src[1] * srcA + dst[1] * (1 - srcA) + 0.5) | 0;
    out[2] = (src[2] * srcA + dst[2] * (1 - srcA) + 0.5) | 0;
    out[4] = 1;
  } else if (srcA === 0) {
    out[0] = dst[0];
    out[1] = dst[1];
    out[2] = dst[2];
    out[3] = dstA;
  } else {
    var outA = srcA + dstA * (1 - srcA);
    if (outA === 0) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
    } else {
      out[0] = ((src[0] * srcA + dst[0] * dstA * (1 - srcA)) / outA + 0.5) | 0;
      out[1] = ((src[1] * srcA + dst[1] * dstA * (1 - srcA)) / outA + 0.5) | 0;
      out[2] = ((src[2] * srcA + dst[2] * dstA * (1 - srcA)) / outA + 0.5) | 0;
      out[3] = outA;
    }
  }
  goog.asserts.assert(ol.color.isValid(out));
  return out;
};


/**
 * @param {ol.Color|string} color Color.
 * @return {ol.Color} Color.
 * @api
 */
ol.color.asArray = function(color) {
  if (goog.isArray(color)) {
    return color;
  } else {
    goog.asserts.assert(goog.isString(color));
    return ol.color.fromString(color);
  }
};


/**
 * @param {ol.Color|string} color Color.
 * @return {string} Rgba string.
 * @api
 */
ol.color.asString = function(color) {
  if (goog.isString(color)) {
    return color;
  } else {
    goog.asserts.assert(goog.isArray(color));
    return ol.color.toString(color);
  }
};


/**
 * @param {ol.Color} color1 Color1.
 * @param {ol.Color} color2 Color2.
 * @return {boolean} Equals.
 */
ol.color.equals = function(color1, color2) {
  return color1 === color2 || (
      color1[0] == color2[0] && color1[1] == color2[1] &&
      color1[2] == color2[2] && color1[3] == color2[3]);
};


/**
 * @param {string} s String.
 * @param {ol.Color=} opt_color Color.
 * @return {ol.Color} Color.
 */
ol.color.fromString = (
    /**
     * @return {function(string, ol.Color=): ol.Color}
     */
    function() {

      // We maintain a small cache of parsed strings.  To provide cheap LRU-like
      // semantics, whenever the cache grows too large we simply delete an
      // arbitrary 25% of the entries.

      /**
       * @const
       * @type {number}
       */
      var MAX_CACHE_SIZE = 1024;

      /**
       * @type {Object.<string, ol.Color>}
       */
      var cache = {};

      /**
       * @type {number}
       */
      var cacheSize = 0;

      return (
          /**
           * @param {string} s String.
           * @param {ol.Color=} opt_color Color.
           * @return {ol.Color} Color.
           */
          function(s, opt_color) {
            var color;
            if (cache.hasOwnProperty(s)) {
              color = cache[s];
            } else {
              if (cacheSize >= MAX_CACHE_SIZE) {
                var i = 0;
                var key;
                for (key in cache) {
                  if ((i++ & 3) === 0) {
                    delete cache[key];
                    --cacheSize;
                  }
                }
              }
              color = ol.color.fromStringInternal_(s);
              cache[s] = color;
              ++cacheSize;
            }
            return ol.color.returnOrUpdate(color, opt_color);
          });

    })();


/**
 * @param {string} s String.
 * @private
 * @return {ol.Color} Color.
 */
ol.color.fromStringInternal_ = function(s) {

  var isHex = false;
  if (ol.ENABLE_NAMED_COLORS && goog.color.names.hasOwnProperty(s)) {
    // goog.color.names does not have a type declaration, so add a typecast
    s = /** @type {string} */ (goog.color.names[s]);
    isHex = true;
  }

  var r, g, b, a, color, match;
  if (isHex || (match = ol.color.hexColorRe_.exec(s))) { // hex
    var n = s.length - 1; // number of hex digits
    goog.asserts.assert(n == 3 || n == 6);
    var d = n == 3 ? 1 : 2; // number of digits per channel
    r = parseInt(s.substr(1 + 0 * d, d), 16);
    g = parseInt(s.substr(1 + 1 * d, d), 16);
    b = parseInt(s.substr(1 + 2 * d, d), 16);
    if (d == 1) {
      r = (r << 4) + r;
      g = (g << 4) + g;
      b = (b << 4) + b;
    }
    a = 1;
    color = [r, g, b, a];
    goog.asserts.assert(ol.color.isValid(color));
    return color;
  } else if ((match = ol.color.rgbaColorRe_.exec(s))) { // rgba()
    r = Number(match[1]);
    g = Number(match[2]);
    b = Number(match[3]);
    a = Number(match[4]);
    color = [r, g, b, a];
    return ol.color.normalize(color, color);
  } else if ((match = ol.color.rgbColorRe_.exec(s))) { // rgb()
    r = Number(match[1]);
    g = Number(match[2]);
    b = Number(match[3]);
    color = [r, g, b, 1];
    return ol.color.normalize(color, color);
  } else {
    goog.asserts.fail(s + ' is not a valid color');
  }

};


/**
 * @param {ol.Color} color Color.
 * @return {boolean} Is valid.
 */
ol.color.isValid = function(color) {
  return 0 <= color[0] && color[0] < 256 &&
      0 <= color[1] && color[1] < 256 &&
      0 <= color[2] && color[2] < 256 &&
      0 <= color[3] && color[3] <= 1;
};


/**
 * @param {ol.Color} color Color.
 * @param {ol.Color=} opt_color Color.
 * @return {ol.Color} Clamped color.
 */
ol.color.normalize = function(color, opt_color) {
  var result = goog.isDef(opt_color) ? opt_color : [];
  result[0] = goog.math.clamp((color[0] + 0.5) | 0, 0, 255);
  result[1] = goog.math.clamp((color[1] + 0.5) | 0, 0, 255);
  result[2] = goog.math.clamp((color[2] + 0.5) | 0, 0, 255);
  result[3] = goog.math.clamp(color[3], 0, 1);
  return result;
};


/**
 * @param {ol.Color} color Color.
 * @param {ol.Color=} opt_color Color.
 * @return {ol.Color} Color.
 */
ol.color.returnOrUpdate = function(color, opt_color) {
  if (goog.isDef(opt_color)) {
    opt_color[0] = color[0];
    opt_color[1] = color[1];
    opt_color[2] = color[2];
    opt_color[3] = color[3];
    return opt_color;
  } else {
    return color;
  }
};


/**
 * @param {ol.Color} color Color.
 * @return {string} String.
 */
ol.color.toString = function(color) {
  var r = color[0];
  if (r != (r | 0)) {
    r = (r + 0.5) | 0;
  }
  var g = color[1];
  if (g != (g | 0)) {
    g = (g + 0.5) | 0;
  }
  var b = color[2];
  if (b != (b | 0)) {
    b = (b + 0.5) | 0;
  }
  var a = color[3];
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};


/**
 * @param {!ol.Color} color Color.
 * @param {goog.vec.Mat4.Number} transform Transform.
 * @param {!ol.Color=} opt_color Color.
 * @return {ol.Color} Transformed color.
 */
ol.color.transform = function(color, transform, opt_color) {
  var result = goog.isDef(opt_color) ? opt_color : [];
  result = goog.vec.Mat4.multVec3(transform, color, result);
  goog.asserts.assert(goog.isArray(result));
  result[3] = color[3];
  return ol.color.normalize(result, result);
};


/**
 * @param {ol.Color|string} color1 Color2.
 * @param {ol.Color|string} color2 Color2.
 * @return {boolean} Equals.
 */
ol.color.stringOrColorEquals = function(color1, color2) {
  if (color1 === color2 || color1 == color2) {
    return true;
  }
  if (goog.isString(color1)) {
    color1 = ol.color.fromString(color1);
  }
  if (goog.isString(color2)) {
    color2 = ol.color.fromString(color2);
  }
  return ol.color.equals(color1, color2);
};
