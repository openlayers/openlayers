/**
 * @module ol/ImageCanvas
 */
import {inherits} from './index.js';
import _ol_ImageBase_ from './ImageBase.js';
import ImageState from './ImageState.js';

/**
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {ol.ImageCanvasLoader=} opt_loader Optional loader function to
 *     support asynchronous canvas drawing.
 */
const ImageCanvas = function(extent, resolution, pixelRatio, canvas, opt_loader) {

  /**
   * Optional canvas loader function.
   * @type {?ol.ImageCanvasLoader}
   * @private
   */
  this.loader_ = opt_loader !== undefined ? opt_loader : null;

  const state = opt_loader !== undefined ? ImageState.IDLE : ImageState.LOADED;

  _ol_ImageBase_.call(this, extent, resolution, pixelRatio, state);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = canvas;

  /**
   * @private
   * @type {Error}
   */
  this.error_ = null;

};

inherits(ImageCanvas, _ol_ImageBase_);


/**
 * Get any error associated with asynchronous rendering.
 * @return {Error} Any error that occurred during rendering.
 */
ImageCanvas.prototype.getError = function() {
  return this.error_;
};


/**
 * Handle async drawing complete.
 * @param {Error} err Any error during drawing.
 * @private
 */
ImageCanvas.prototype.handleLoad_ = function(err) {
  if (err) {
    this.error_ = err;
    this.state = ImageState.ERROR;
  } else {
    this.state = ImageState.LOADED;
  }
  this.changed();
};


/**
 * @inheritDoc
 */
ImageCanvas.prototype.load = function() {
  if (this.state == ImageState.IDLE) {
    this.state = ImageState.LOADING;
    this.changed();
    this.loader_(this.handleLoad_.bind(this));
  }
};


/**
 * @inheritDoc
 */
ImageCanvas.prototype.getImage = function() {
  return this.canvas_;
};
export default ImageCanvas;
