goog.provide('ol.Image');

goog.require('ol');
goog.require('ol.ImageBase');
goog.require('ol.ImageState');
goog.require('ol.events');
goog.require('ol.events.EventType');
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

  ol.ImageBase.call(this, extent, resolution, pixelRatio, ol.ImageState.IDLE,
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
   * @type {Array.<ol.EventsKey>}
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
ol.inherits(ol.Image, ol.ImageBase);


/**
 * @inheritDoc
 * @api
 */
ol.Image.prototype.getImage = function() {
  return this.image_;
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
 * Load the image or retry if loading previously failed.
 * Loading is taken care of by the tile queue, and calling this method is
 * only needed for preloading or for reloading in case of an error.
 * @override
 * @api
 */
ol.Image.prototype.load = function() {
  if (this.state == ol.ImageState.IDLE || this.state == ol.ImageState.ERROR) {
    this.state = ol.ImageState.LOADING;
    this.changed();
    this.imageListenerKeys_ = [
      ol.events.listenOnce(this.image_, ol.events.EventType.ERROR,
          this.handleImageError_, this),
      ol.events.listenOnce(this.image_, ol.events.EventType.LOAD,
          this.handleImageLoad_, this)
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
  this.imageListenerKeys_.forEach(ol.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};
