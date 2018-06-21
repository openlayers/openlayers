/**
 * @module ol/Image
 */
import {inherits} from './util.js';
import ImageBase from './ImageBase.js';
import ImageState from './ImageState.js';
import {listenOnce, unlistenByKey} from './events.js';
import EventType from './events/EventType.js';
import {getHeight} from './extent.js';


/**
 * A function that takes an {@link module:ol/Image~Image} for the image and a
 * `{string}` for the src as arguments. It is supposed to make it so the
 * underlying image {@link module:ol/Image~Image#getImage} is assigned the
 * content specified by the src. If not specified, the default is
 *
 *     function(image, src) {
 *       image.getImage().src = src;
 *     }
 *
 * Providing a custom `imageLoadFunction` can be useful to load images with
 * post requests or - in general - through XHR requests, where the src of the
 * image element would be set to a data URI when the content is loaded.
 *
 * @typedef {function(module:ol/Image, string)} LoadFunction
 * @api
 */


/**
 * @constructor
 * @extends {module:ol/ImageBase}
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number|undefined} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {module:ol/Image~LoadFunction} imageLoadFunction Image load function.
 */
const ImageWrapper = function(extent, resolution, pixelRatio, src, crossOrigin, imageLoadFunction) {

  ImageBase.call(this, extent, resolution, pixelRatio, ImageState.IDLE);

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
   * @type {Array.<module:ol/events~EventsKey>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @protected
   * @type {module:ol/ImageState}
   */
  this.state = ImageState.IDLE;

  /**
   * @private
   * @type {module:ol/Image~LoadFunction}
   */
  this.imageLoadFunction_ = imageLoadFunction;

};

inherits(ImageWrapper, ImageBase);


/**
 * @inheritDoc
 * @api
 */
ImageWrapper.prototype.getImage = function() {
  return this.image_;
};


/**
 * Tracks loading or read errors.
 *
 * @private
 */
ImageWrapper.prototype.handleImageError_ = function() {
  this.state = ImageState.ERROR;
  this.unlistenImage_();
  this.changed();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
ImageWrapper.prototype.handleImageLoad_ = function() {
  if (this.resolution === undefined) {
    this.resolution = getHeight(this.extent) / this.image_.height;
  }
  this.state = ImageState.LOADED;
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
ImageWrapper.prototype.load = function() {
  if (this.state == ImageState.IDLE || this.state == ImageState.ERROR) {
    this.state = ImageState.LOADING;
    this.changed();
    this.imageListenerKeys_ = [
      listenOnce(this.image_, EventType.ERROR,
        this.handleImageError_, this),
      listenOnce(this.image_, EventType.LOAD,
        this.handleImageLoad_, this)
    ];
    this.imageLoadFunction_(this, this.src_);
  }
};


/**
 * @param {HTMLCanvasElement|Image|HTMLVideoElement} image Image.
 */
ImageWrapper.prototype.setImage = function(image) {
  this.image_ = image;
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
ImageWrapper.prototype.unlistenImage_ = function() {
  this.imageListenerKeys_.forEach(unlistenByKey);
  this.imageListenerKeys_ = null;
};

export default ImageWrapper;
