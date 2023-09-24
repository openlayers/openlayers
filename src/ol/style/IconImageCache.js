/**
 * @module ol/style/IconImageCache
 */
import RegularShape from './RegularShape.js';

/**
 * @classdesc
 * Singleton class. Available through {@link module:ol/style/IconImageCache.shared}.
 */
class IconImageCache {
  constructor() {
    /**
     * @type {!Object<string, import("./IconImage.js").default | import("./RegularShape.js").default>}
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
    this.maxCacheSize_ = 128;
  }

  /**
   * Remove all cached items
   */
  clear() {
    this.cache_ = {};
    this.cacheSize_ = 0;
  }

  /**
   * @return {boolean} Can expire cache.
   */
  canExpireCache() {
    return this.cacheSize_ > this.maxCacheSize_;
  }

  /**
   * Evict some cached items
   */
  expire() {
    if (!this.canExpireCache()) {
      return;
    }
    let i = 0;
    for (const key in this.cache_) {
      const icon = this.cache_[key];
      if (
        (i++ & 3) === 0 &&
        (icon instanceof RegularShape || !icon.hasListener())
      ) {
        delete this.cache_[key];
        --this.cacheSize_;
      }
    }
  }

  /**
   * @param {string} key Key.
   * @return {import("./IconImage.js").default | RegularShape} Icon image.
   */
  get(key) {
    return key in this.cache_ ? this.cache_[key] : null;
  }

  /**
   * @param {string} key Key.
   * @param {import("./IconImage.js").default | import("./RegularShape.js").default} icon Icon.
   */
  set(key, icon) {
    this.cache_[key] = icon;
    ++this.cacheSize_;
  }

  /**
   * Set the cache size of the icon cache. Default is `128`.Change this value when
   * your map uses more than the default number of icons images or RegularShapes
   * and you are not caching these on the application level.
   * @param {number} maxCacheSize Cache max size.
   * @api
   */
  setSize(maxCacheSize) {
    this.maxCacheSize_ = maxCacheSize;
    this.expire();
  }
}

/**
 * @param {string} src Src.
 * @param {string|null} crossOrigin Cross origin.
 * @param {string|null} color Color.
 * @return {string} Cache key.
 */
export function getIconKey(src, crossOrigin, color) {
  return src + ':' + crossOrigin + ':' + color;
}

export default IconImageCache;

/**
 * The {@link module:ol/style/IconImageCache~IconImageCache} for
 * {@link module:ol/style/Icon~Icon} images.
 * @api
 */
export const shared = new IconImageCache();
