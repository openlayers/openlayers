/**
 * @module ol/ImageCanvas
 */
import {inherits} from './util.js';
import ImageBase from './ImageBase.js';
import ImageState from './ImageState.js';


/**
 * A function that is called to trigger asynchronous canvas drawing.  It is
 * called with a "done" callback that should be called when drawing is done.
 * If any error occurs during drawing, the "done" callback should be called with
 * that error.
 *
 * @typedef {function(function(Error))} Loader
 */


/**
 * @constructor
 * @extends {module:ol/ImageBase}
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {module:ol/ImageCanvas~Loader=} opt_loader Optional loader function to
 *     support asynchronous canvas drawing.
 */
const ImageCanvas = function(extent, resolution, pixelRatio, canvas, opt_loader) {

  /**
   * Optional canvas loader function.
   * @type {?module:ol/ImageCanvas~Loader}
   * @private
   */
  this.loader_ = opt_loader !== undefined ? opt_loader : null;

  const state = opt_loader !== undefined ? ImageState.IDLE : ImageState.LOADED;

  ImageBase.call(this, extent, resolution, pixelRatio, state);

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

inherits(ImageCanvas, ImageBase);


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
 * @return {HTMLCanvasElement} Canvas element.
 */
ImageCanvas.prototype.getImage = function() {
  return this.canvas_;
};
export default ImageCanvas;
