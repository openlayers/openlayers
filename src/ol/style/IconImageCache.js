/**
 * @module ol/style/IconImageCache
 */
import {asString} from '../color.js';

/**
 * Singleton class. Available through {@link module:ol/style/IconImageCache~shared}.
 * @constructor
 */
const IconImageCache = function() {

  /**
   * @type {!Object.<string, module:ol/style/IconImage>}
   * @private
   */
  this.cache_ = {};

  /**
   * @type {number}
   * @private
   */
  this.cacheSize_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.maxCacheSize_ = 32;
};


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @param {module:ol/color~Color} color Color.
 * @return {string} Cache key.
 */
function getKey(src, crossOrigin, color) {
  const colorString = color ? asString(color) : 'null';
  return crossOrigin + ':' + src + ':' + colorString;
}


/**
 * FIXME empty description for jsdoc
 */
IconImageCache.prototype.clear = function() {
  this.cache_ = {};
  this.cacheSize_ = 0;
};


/**
 * FIXME empty description for jsdoc
 */
IconImageCache.prototype.expire = function() {
  if (this.cacheSize_ > this.maxCacheSize_) {
    let i = 0;
    for (const key in this.cache_) {
      const iconImage = this.cache_[key];
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
 * @param {module:ol/color~Color} color Color.
 * @return {module:ol/style/IconImage} Icon image.
 */
IconImageCache.prototype.get = function(src, crossOrigin, color) {
  const key = getKey(src, crossOrigin, color);
  return key in this.cache_ ? this.cache_[key] : null;
};


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @param {module:ol/color~Color} color Color.
 * @param {module:ol/style/IconImage} iconImage Icon image.
 */
IconImageCache.prototype.set = function(src, crossOrigin, color, iconImage) {
  const key = getKey(src, crossOrigin, color);
  this.cache_[key] = iconImage;
  ++this.cacheSize_;
};


/**
 * Set the cache size of the icon cache. Default is `32`. Change this value when
 * your map uses more than 32 different icon images and you are not caching icon
 * styles on the application level.
 * @param {number} maxCacheSize Cache max size.
 * @api
 */
IconImageCache.prototype.setSize = function(maxCacheSize) {
  this.maxCacheSize_ = maxCacheSize;
  this.expire();
};
export default IconImageCache;


/**
 * The {@link module:ol/style/IconImageCache~IconImageCache} for
 * {@link module:ol/style/Icon~Icon} images.
 * @api
 */
export const shared = new IconImageCache();
