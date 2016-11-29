goog.provide('ol.color');

goog.require('ol.asserts');
goog.require('ol.math');


/**
 * This RegExp matches # followed by 3 or 6 hex digits.
 * @const
 * @type {RegExp}
 * @private
 */
ol.color.HEX_COLOR_RE_ = /^#(?:[0-9a-f]{3}){1,2}$/i;


/**
 * Regular expression for matching potential named color style strings.
 * @const
 * @type {RegExp}
 * @private
 */
ol.color.NAMED_COLOR_RE_ = /^([a-z]*)$/i;


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
    return ol.color.fromString(/** @type {string} */ (color));
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
    return ol.color.toString(color);
  }
};

/**
 * Return named color as an rgba string.
 * @param {string} color Named color.
 * @return {string} Rgb string.
 */
ol.color.fromNamed = function(color) {
  var el = document.createElement('div');
  el.style.color = color;
  document.body.appendChild(el);
  var rgb = getComputedStyle(el).color;
  document.body.removeChild(el);
  return rgb;
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
  var r, g, b, a, color, parts;

  if (ol.color.NAMED_COLOR_RE_.exec(s)) {
    s = ol.color.fromNamed(s);
  }

  if (ol.color.HEX_COLOR_RE_.exec(s)) { // hex
    var n = s.length - 1; // number of hex digits
    ol.asserts.assert(n == 3 || n == 6, 54); // Hex color should have 3 or 6 digits
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
  } else if (s.indexOf('rgba(') == 0) { // rgba()
    parts = s.slice(5, -1).split(',').map(Number);
    color = ol.color.normalize(parts);
  } else if (s.indexOf('rgb(') == 0) { // rgb()
    parts = s.slice(4, -1).split(',').map(Number);
    parts.push(1);
    color = ol.color.normalize(parts);
  } else {
    ol.asserts.assert(false, 14); // Invalid color
  }
  return /** @type {ol.Color} */ (color);
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
