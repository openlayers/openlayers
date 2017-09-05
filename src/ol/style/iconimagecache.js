import _ol_color_ from '../color';

/**
 * @constructor
 */
var _ol_style_IconImageCache_ = function() {

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
_ol_style_IconImageCache_.getKey = function(src, crossOrigin, color) {
  var colorString = color ? _ol_color_.asString(color) : 'null';
  return crossOrigin + ':' + src + ':' + colorString;
};


/**
 * FIXME empty description for jsdoc
 */
_ol_style_IconImageCache_.prototype.clear = function() {
  this.cache_ = {};
  this.cacheSize_ = 0;
};


/**
 * FIXME empty description for jsdoc
 */
_ol_style_IconImageCache_.prototype.expire = function() {
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
_ol_style_IconImageCache_.prototype.get = function(src, crossOrigin, color) {
  var key = _ol_style_IconImageCache_.getKey(src, crossOrigin, color);
  return key in this.cache_ ? this.cache_[key] : null;
};


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.Color} color Color.
 * @param {ol.style.IconImage} iconImage Icon image.
 */
_ol_style_IconImageCache_.prototype.set = function(src, crossOrigin, color, iconImage) {
  var key = _ol_style_IconImageCache_.getKey(src, crossOrigin, color);
  this.cache_[key] = iconImage;
  ++this.cacheSize_;
};
export default _ol_style_IconImageCache_;
