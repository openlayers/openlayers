goog.provide('ol.style.IconImage');

goog.require('ol');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.events.EventTarget');
goog.require('ol.events.EventType');
goog.require('ol.style');
goog.require('ol.style.ImageState');


/**
 * @constructor
 * @param {Image|HTMLCanvasElement} image Image.
 * @param {string|undefined} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.style.ImageState} imageState Image state.
 * @param {ol.Color} color Color.
 * @extends {ol.events.EventTarget}
 */
ol.style.IconImage = function(image, src, size, crossOrigin, imageState,
                               color) {

  ol.events.EventTarget.call(this);

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
   * @type {ol.style.ImageState}
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
  if (this.imageState_ == ol.style.ImageState.LOADED) {
    this.determineTainting_();
  }

};
ol.inherits(ol.style.IconImage, ol.events.EventTarget);


/**
 * @param {Image|HTMLCanvasElement} image Image.
 * @param {string} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.style.ImageState} imageState Image state.
 * @param {ol.Color} color Color.
 * @return {ol.style.IconImage} Icon image.
 */
ol.style.IconImage.get = function(image, src, size, crossOrigin, imageState,
                                   color) {
  var iconImageCache = ol.style.iconImageCache;
  var iconImage = iconImageCache.get(src, crossOrigin, color);
  if (!iconImage) {
    iconImage = new ol.style.IconImage(
        image, src, size, crossOrigin, imageState, color);
    iconImageCache.set(src, crossOrigin, color, iconImage);
  }
  return iconImage;
};


/**
 * @private
 */
ol.style.IconImage.prototype.determineTainting_ = function() {
  var context = ol.dom.createCanvasContext2D(1, 1);
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
ol.style.IconImage.prototype.dispatchChangeEvent_ = function() {
  this.dispatchEvent(ol.events.EventType.CHANGE);
};


/**
 * @private
 */
ol.style.IconImage.prototype.handleImageError_ = function() {
  this.imageState_ = ol.style.ImageState.ERROR;
  this.unlistenImage_();
  this.dispatchChangeEvent_();
};


/**
 * @private
 */
ol.style.IconImage.prototype.handleImageLoad_ = function() {
  this.imageState_ = ol.style.ImageState.LOADED;
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
ol.style.IconImage.prototype.getImage = function(pixelRatio) {
  return this.canvas_ ? this.canvas_ : this.image_;
};


/**
 * @return {ol.style.ImageState} Image state.
 */
ol.style.IconImage.prototype.getImageState = function() {
  return this.imageState_;
};


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image|HTMLCanvasElement} Image element.
 */
ol.style.IconImage.prototype.getHitDetectionImage = function(pixelRatio) {
  if (!this.hitDetectionImage_) {
    if (this.tainting_) {
      var width = this.size_[0];
      var height = this.size_[1];
      var context = ol.dom.createCanvasContext2D(width, height);
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
ol.style.IconImage.prototype.getSize = function() {
  return this.size_;
};


/**
 * @return {string|undefined} Image src.
 */
ol.style.IconImage.prototype.getSrc = function() {
  return this.src_;
};


/**
 * Load not yet loaded URI.
 */
ol.style.IconImage.prototype.load = function() {
  if (this.imageState_ == ol.style.ImageState.IDLE) {
    goog.DEBUG && console.assert(this.src_ !== undefined,
        'this.src_ must not be undefined');
    goog.DEBUG && console.assert(!this.imageListenerKeys_,
        'no listener keys existing');
    this.imageState_ = ol.style.ImageState.LOADING;
    this.imageListenerKeys_ = [
      ol.events.listenOnce(this.image_, ol.events.EventType.ERROR,
          this.handleImageError_, this),
      ol.events.listenOnce(this.image_, ol.events.EventType.LOAD,
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
ol.style.IconImage.prototype.replaceColor_ = function() {
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
ol.style.IconImage.prototype.unlistenImage_ = function() {
  this.imageListenerKeys_.forEach(ol.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};
