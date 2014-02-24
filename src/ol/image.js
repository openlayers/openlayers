goog.provide('ol.Image');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.ImageBase');
goog.require('ol.ImageState');



/**
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Array.<ol.Attribution>} attributions Attributions.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 */
ol.Image =
    function(extent, resolution, pixelRatio, attributions, src, crossOrigin) {

  goog.base(this, extent, resolution, pixelRatio, ol.ImageState.IDLE,
      attributions);

  /**
   * @private
   * @type {string}
   */
  this.src_ = src;

  /**
   * @private
   * @type {Image}
   */
  this.image_ = new Image();
  if (!goog.isNull(crossOrigin)) {
    this.image_.crossOrigin = crossOrigin;
  }

  /**
   * @private
   * @type {Object.<number, Image>}
   */
  this.imageByContext_ = {};

  /**
   * @private
   * @type {Array.<number>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @protected
   * @type {ol.ImageState}
   */
  this.state = ol.ImageState.IDLE;
};
goog.inherits(ol.Image, ol.ImageBase);


/**
 * @param {Object=} opt_context Object.
 * @return {HTMLCanvasElement|Image|HTMLVideoElement} Image.
 */
ol.Image.prototype.getImageElement = function(opt_context) {
  if (goog.isDef(opt_context)) {
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
  this.dispatchChangeEvent();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
ol.Image.prototype.handleImageLoad_ = function() {
  this.state = ol.ImageState.LOADED;
  this.unlistenImage_();
  this.dispatchChangeEvent();
};


/**
 * Load not yet loaded URI.
 */
ol.Image.prototype.load = function() {
  if (this.state == ol.ImageState.IDLE) {
    this.state = ol.ImageState.LOADING;
    goog.asserts.assert(goog.isNull(this.imageListenerKeys_));
    this.imageListenerKeys_ = [
      goog.events.listenOnce(this.image_, goog.events.EventType.ERROR,
          this.handleImageError_, false, this),
      goog.events.listenOnce(this.image_, goog.events.EventType.LOAD,
          this.handleImageLoad_, false, this)
    ];
    this.image_.src = this.src_;
  }
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
ol.Image.prototype.unlistenImage_ = function() {
  goog.asserts.assert(!goog.isNull(this.imageListenerKeys_));
  goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};
