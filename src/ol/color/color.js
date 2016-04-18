// We can't use goog.color or goog.color.alpha because they interally use a hex
// string representation that encodes each channel in a single byte.  This
// causes occasional loss of precision and rounding errors, especially in the
// alpha channel.

goog.provide('ol.color');

goog.require('goog.asserts');
goog.require('goog.color');
goog.require('goog.color.names');
goog.require('ol');
goog.require('ol.math');


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
 * Return the color as an array. This function maintains a cache of calculated
 * arrays which means the result should not be modified.
 * @param {ol.Color|string} color Color.
 * @return {ol.Color} Color.
 * @api
 */
ol.color.asArray = function(color) {
  if (Array.isArray(color)) {
    return color;
  } else {
    goog.asserts.assert(typeof color === 'string', 'Color should be a string');
    return ol.color.fromString(color);
  }
};


/**
 * Return the color as an rgba string.
 * @param {ol.Color|string} color Color.
 * @return {string} Rgba string.
 * @api
 */
ol.color.asString = function(color) {
  if (typeof color === 'string') {
    return color;
  } else {
    goog.asserts.assert(Array.isArray(color), 'Color should be an array');
    return ol.color.toString(color);
  }
};


/**
 * @param {string} s String.
 * @return {ol.Color} Color.
 */
ol.color.fromString = (
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
           * @return {ol.Color} Color.
           */
          function(s) {
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
            return color;
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
    s = goog.color.names[s];
    isHex = true;
  }

  var r, g, b, a, color, match;
  if (isHex || (match = ol.color.hexColorRe_.exec(s))) { // hex
    var n = s.length - 1; // number of hex digits
    goog.asserts.assert(n == 3 || n == 6,
        'Color string length should be 3 or 6');
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
    goog.asserts.assert(ol.color.isValid(color),
        'Color should be a valid color');
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
  var result = opt_color || [];
  result[0] = ol.math.clamp((color[0] + 0.5) | 0, 0, 255);
  result[1] = ol.math.clamp((color[1] + 0.5) | 0, 0, 255);
  result[2] = ol.math.clamp((color[2] + 0.5) | 0, 0, 255);
  result[3] = ol.math.clamp(color[3], 0, 1);
  return result;
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
  var a = color[3] === undefined ? 1 : color[3];
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};
