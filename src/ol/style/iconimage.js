import _ol_ from '../index';
import _ol_dom_ from '../dom';
import _ol_events_ from '../events';
import _ol_events_EventTarget_ from '../events/eventtarget';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_ImageState_ from '../imagestate';
import _ol_style_ from '../style';

/**
 * @constructor
 * @param {Image|HTMLCanvasElement} image Image.
 * @param {string|undefined} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.ImageState} imageState Image state.
 * @param {ol.Color} color Color.
 * @extends {ol.events.EventTarget}
 */
var _ol_style_IconImage_ = function(image, src, size, crossOrigin, imageState,
    color) {

  _ol_events_EventTarget_.call(this);

  /**
   * @private
   * @type {Image|HTMLCanvasElement}
   */
  this.hitDetectionImage_ = null;

  /**
   * @private
   * @type {Image|HTMLCanvasElement}
   */
  this.image_ = !image ? new Image() : image;

  if (crossOrigin !== null) {
    this.image_.crossOrigin = crossOrigin;
  }

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = color ?
    /** @type {HTMLCanvasElement} */ (document.createElement('CANVAS')) :
    null;

  /**
   * @private
   * @type {ol.Color}
   */
  this.color_ = color;

  /**
   * @private
   * @type {Array.<ol.EventsKey>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @private
   * @type {ol.ImageState}
   */
  this.imageState_ = imageState;

  /**
   * @private
   * @type {ol.Size}
   */
  this.size_ = size;

  /**
   * @private
   * @type {string|undefined}
   */
  this.src_ = src;

  /**
   * @private
   * @type {boolean}
   */
  this.tainting_ = false;
  if (this.imageState_ == _ol_ImageState_.LOADED) {
    this.determineTainting_();
  }

};

_ol_.inherits(_ol_style_IconImage_, _ol_events_EventTarget_);


/**
 * @param {Image|HTMLCanvasElement} image Image.
 * @param {string} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.ImageState} imageState Image state.
 * @param {ol.Color} color Color.
 * @return {ol.style.IconImage} Icon image.
 */
_ol_style_IconImage_.get = function(image, src, size, crossOrigin, imageState,
    color) {
  var iconImageCache = _ol_style_.iconImageCache;
  var iconImage = iconImageCache.get(src, crossOrigin, color);
  if (!iconImage) {
    iconImage = new _ol_style_IconImage_(
        image, src, size, crossOrigin, imageState, color);
    iconImageCache.set(src, crossOrigin, color, iconImage);
  }
  return iconImage;
};


/**
 * @private
 */
_ol_style_IconImage_.prototype.determineTainting_ = function() {
  var context = _ol_dom_.createCanvasContext2D(1, 1);
  try {
    context.drawImage(this.image_, 0, 0);
    context.getImageData(0, 0, 1, 1);
  } catch (e) {
    this.tainting_ = true;
  }
};


/**
 * @private
 */
_ol_style_IconImage_.prototype.dispatchChangeEvent_ = function() {
  this.dispatchEvent(_ol_events_EventType_.CHANGE);
};


/**
 * @private
 */
_ol_style_IconImage_.prototype.handleImageError_ = function() {
  this.imageState_ = _ol_ImageState_.ERROR;
  this.unlistenImage_();
  this.dispatchChangeEvent_();
};


/**
 * @private
 */
_ol_style_IconImage_.prototype.handleImageLoad_ = function() {
  this.imageState_ = _ol_ImageState_.LOADED;
  if (this.size_) {
    this.image_.width = this.size_[0];
    this.image_.height = this.size_[1];
  }
  this.size_ = [this.image_.width, this.image_.height];
  this.unlistenImage_();
  this.determineTainting_();
  this.replaceColor_();
  this.dispatchChangeEvent_();
};


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image|HTMLCanvasElement} Image or Canvas element.
 */
_ol_style_IconImage_.prototype.getImage = function(pixelRatio) {
  return this.canvas_ ? this.canvas_ : this.image_;
};


/**
 * @return {ol.ImageState} Image state.
 */
_ol_style_IconImage_.prototype.getImageState = function() {
  return this.imageState_;
};


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image|HTMLCanvasElement} Image element.
 */
_ol_style_IconImage_.prototype.getHitDetectionImage = function(pixelRatio) {
  if (!this.hitDetectionImage_) {
    if (this.tainting_) {
      var width = this.size_[0];
      var height = this.size_[1];
      var context = _ol_dom_.createCanvasContext2D(width, height);
      context.fillRect(0, 0, width, height);
      this.hitDetectionImage_ = context.canvas;
    } else {
      this.hitDetectionImage_ = this.image_;
    }
  }
  return this.hitDetectionImage_;
};


/**
 * @return {ol.Size} Image size.
 */
_ol_style_IconImage_.prototype.getSize = function() {
  return this.size_;
};


/**
 * @return {string|undefined} Image src.
 */
_ol_style_IconImage_.prototype.getSrc = function() {
  return this.src_;
};


/**
 * Load not yet loaded URI.
 */
_ol_style_IconImage_.prototype.load = function() {
  if (this.imageState_ == _ol_ImageState_.IDLE) {
    this.imageState_ = _ol_ImageState_.LOADING;
    this.imageListenerKeys_ = [
      _ol_events_.listenOnce(this.image_, _ol_events_EventType_.ERROR,
          this.handleImageError_, this),
      _ol_events_.listenOnce(this.image_, _ol_events_EventType_.LOAD,
          this.handleImageLoad_, this)
    ];
    try {
      this.image_.src = this.src_;
    } catch (e) {
      this.handleImageError_();
    }
  }
};


/**
 * @private
 */
_ol_style_IconImage_.prototype.replaceColor_ = function() {
  if (this.tainting_ || this.color_ === null) {
    return;
  }

  this.canvas_.width = this.image_.width;
  this.canvas_.height = this.image_.height;

  var ctx = this.canvas_.getContext('2d');
  ctx.drawImage(this.image_, 0, 0);

  var imgData = ctx.getImageData(0, 0, this.image_.width, this.image_.height);
  var data = imgData.data;
  var r = this.color_[0] / 255.0;
  var g = this.color_[1] / 255.0;
  var b = this.color_[2] / 255.0;

  for (var i = 0, ii = data.length; i < ii; i += 4) {
    data[i] *= r;
    data[i + 1] *= g;
    data[i + 2] *= b;
  }
  ctx.putImageData(imgData, 0, 0);
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
_ol_style_IconImage_.prototype.unlistenImage_ = function() {
  this.imageListenerKeys_.forEach(_ol_events_.unlistenByKey);
  this.imageListenerKeys_ = null;
};
export default _ol_style_IconImage_;
