goog.provide('ol.style.IconImageCache');

goog.require('ol.color');


/**
 * @constructor
 */
ol.style.IconImageCache = function() {

  /**
   * @type {Object.<string, ol.style.IconImage>}
   * @private
   */
  this.cache_ = {};

  /**
   * @type {number}
   * @private
   */
  this.cacheSize_ = 0;

  /**
   * @const
   * @type {number}
   * @private
   */
  this.maxCacheSize_ = 32;
};


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.Color} color Color.
 * @return {string} Cache key.
 */
ol.style.IconImageCache.getKey = function(src, crossOrigin, color) {
  goog.DEBUG && console.assert(crossOrigin !== undefined,
      'argument crossOrigin must be defined');
  var colorString = color ? ol.color.asString(color) : 'null';
  return crossOrigin + ':' + src + ':' + colorString;
};


/**
 * FIXME empty description for jsdoc
 */
ol.style.IconImageCache.prototype.clear = function() {
  this.cache_ = {};
  this.cacheSize_ = 0;
};


/**
 * FIXME empty description for jsdoc
 */
ol.style.IconImageCache.prototype.expire = function() {
  if (this.cacheSize_ > this.maxCacheSize_) {
    var i = 0;
    var key, iconImage;
    for (key in this.cache_) {
      iconImage = this.cache_[key];
      if ((i++ & 3) === 0 && !iconImage.hasListener()) {
        delete this.cache_[key];
        --this.cacheSize_;
      }
    }
  }
};


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.Color} color Color.
 * @return {ol.style.IconImage} Icon image.
 */
ol.style.IconImageCache.prototype.get = function(src, crossOrigin, color) {
  var key = ol.style.IconImageCache.getKey(src, crossOrigin, color);
  return key in this.cache_ ? this.cache_[key] : null;
};


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.Color} color Color.
 * @param {ol.style.IconImage} iconImage Icon image.
 */
ol.style.IconImageCache.prototype.set = function(src, crossOrigin, color,
                                                 iconImage) {
  var key = ol.style.IconImageCache.getKey(src, crossOrigin, color);
  this.cache_[key] = iconImage;
  ++this.cacheSize_;
};
