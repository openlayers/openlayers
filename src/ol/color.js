// ol.color is based on goog.color and goog.color.alpha
// goog.color and goog.color.alpha use a hex string representation that encodes
// each channel as a byte (a two character hex string).  This causes occasional
// loss of precision and rounding errors, especially in the alpha channel.
// FIXME don't use goog.color or goog.color.alpha
// FIXME move the color matrix code from ol.renderer.webgl.Layer to here

goog.provide('ol.color');

goog.require('goog.asserts');
goog.require('goog.color');
goog.require('goog.color.alpha');
goog.require('goog.math');
goog.require('goog.vec.Mat4');


/**
 * A color represented as a short array [red, green, blue, alpha].
 * red, green, and blue should be integers in the range 0..255 inclusive.
 * alpha should be a float in the range 0..1 inclusive.
 * @typedef {Array.<number>}
 */
ol.Color;


/**
 * @param {string} s String.
 * @param {ol.Color=} opt_color Color.
 * @return {ol.Color} Color.
 */
ol.color.fromString = (function() {

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
              if (i++ & 3 === 0) {
                delete cache[key];
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

  /** @preserveTry */
  try {
    var rgba = goog.color.alpha.parse(s);
    return goog.color.alpha.hexToRgba(rgba.hex);
  } catch (e) {
    // goog.color.alpha.parse throws an Error on named and rgb-style colors.
    var rgb = goog.color.parse(s);
    var result = goog.color.hexToRgb(rgb.hex);
    result.push(1);
    return result;
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
 * @param {ol.Color} color Color.
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 * @param {ol.Color=} opt_color Color.
 * @return {ol.Color} Transformed color.
 */
ol.color.transform = function(color, transform, opt_color) {
  var result = goog.isDef(opt_color) ? opt_color : [];
  result = goog.vec.Mat4.multVec3(transform, color, result);
  goog.asserts.assert(goog.isArray(result));
  result[3] = color[3];
  return ol.color.normalize(result, result);
};
