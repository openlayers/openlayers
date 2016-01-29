goog.provide('ol.Image');

goog.require('goog.asserts');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('goog.object');
goog.require('ol.ImageBase');
goog.require('ol.ImageState');
goog.require('ol.extent');


/**
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.Extent} extent Extent.
 * @param {number|undefined} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Array.<ol.Attribution>} attributions Attributions.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.ImageLoadFunctionType} imageLoadFunction Image load function.
 */
ol.Image = function(extent, resolution, pixelRatio, attributions, src,
    crossOrigin, imageLoadFunction) {

  goog.base(this, extent, resolution, pixelRatio, ol.ImageState.IDLE,
      attributions);

  /**
   * @private
   * @type {string}
   */
  this.src_ = src;

  /**
   * @private
   * @type {HTMLCanvasElement|Image|HTMLVideoElement}
   */
  this.image_ = new Image();
  if (crossOrigin !== null) {
    this.image_.crossOrigin = crossOrigin;
  }

  /**
   * @private
   * @type {Object.<number, (HTMLCanvasElement|Image|HTMLVideoElement)>}
   */
  this.imageByContext_ = {};

  /**
   * @private
   * @type {Array.<ol.events.Key>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @protected
   * @type {ol.ImageState}
   */
  this.state = ol.ImageState.IDLE;

  /**
   * @private
   * @type {ol.ImageLoadFunctionType}
   */
  this.imageLoadFunction_ = imageLoadFunction;

};
goog.inherits(ol.Image, ol.ImageBase);


/**
 * Get the HTML image element (may be a Canvas, Image, or Video).
 * @param {Object=} opt_context Object.
 * @return {HTMLCanvasElement|Image|HTMLVideoElement} Image.
 * @api
 */
ol.Image.prototype.getImage = function(opt_context) {
  if (opt_context !== undefined) {
    var image;
    var key = goog.getUid(opt_context);
    if (key in this.imageByContext_) {
      return this.imageByContext_[key];
    } else if (goog.object.isEmpty(this.imageByContext_)) {
      image = this.image_;
    } else {
      image = /** @type {Image} */ (this.image_.cloneNode(false));
    }
    this.imageByContext_[key] = image;
    return image;
  } else {
    return this.image_;
  }
};


/**
 * Tracks loading or read errors.
 *
 * @private
 */
ol.Image.prototype.handleImageError_ = function() {
  this.state = ol.ImageState.ERROR;
  this.unlistenImage_();
  this.changed();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
ol.Image.prototype.handleImageLoad_ = function() {
  if (this.resolution === undefined) {
    this.resolution = ol.extent.getHeight(this.extent) / this.image_.height;
  }
  this.state = ol.ImageState.LOADED;
  this.unlistenImage_();
  this.changed();
};


/**
 * Load not yet loaded URI.
 */
ol.Image.prototype.load = function() {
  if (this.state == ol.ImageState.IDLE) {
    this.state = ol.ImageState.LOADING;
    this.changed();
    goog.asserts.assert(!this.imageListenerKeys_,
        'this.imageListenerKeys_ should be null');
    this.imageListenerKeys_ = [
      ol.events.listenOnce(this.image_, ol.events.EventType.ERROR,
          this.handleImageError_, false, this),
      ol.events.listenOnce(this.image_, ol.events.EventType.LOAD,
          this.handleImageLoad_, false, this)
    ];
    this.imageLoadFunction_(this, this.src_);
  }
};


/**
 * @param {HTMLCanvasElement|Image|HTMLVideoElement} image Image.
 */
ol.Image.prototype.setImage = function(image) {
  this.image_ = image;
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
ol.Image.prototype.unlistenImage_ = function() {
  goog.asserts.assert(this.imageListenerKeys_,
      'this.imageListenerKeys_ should not be null');
  this.imageListenerKeys_.forEach(ol.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};
