/**
 * @module ol/ImageCanvas
 */
import ImageWrapper from './Image.js';
import ImageState from './ImageState.js';

/**
 * A function that is called to trigger asynchronous canvas drawing.  It is
 * called with a "done" callback that should be called when drawing is done.
 * If any error occurs during drawing, the "done" callback should be called with
 * that error.
 *
 * @typedef {function(function(Error=): void): void} Loader
 */

class ImageCanvas extends ImageWrapper {
  /**
   * @param {import("./extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {HTMLCanvasElement} canvas Canvas.
   * @param {Loader} [loader] Optional loader function to
   *     support asynchronous canvas drawing.
   */
  constructor(extent, resolution, pixelRatio, canvas, loader) {
    const state = loader !== undefined ? ImageState.IDLE : ImageState.LOADED;

    super(extent, resolution, pixelRatio, state);

    /**
     * Optional canvas loader function.
     * @type {?Loader}
     * @private
     */
    this.loader_ = loader !== undefined ? loader : null;

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = canvas;

    /**
     * @private
     * @type {?Error}
     */
    this.error_ = null;
  }

  /**
   * Get any error associated with asynchronous rendering.
   * @return {?Error} Any error that occurred during rendering.
   */
  getError() {
    return this.error_;
  }

  /**
   * Handle async drawing complete.
   * @param {Error} [err] Any error during drawing.
   * @private
   */
  handleLoad_(err) {
    if (err) {
      this.error_ = err;
      this.state = ImageState.ERROR;
    } else {
      this.state = ImageState.LOADED;
    }
    this.changed();
  }

  /**
   * Load not yet loaded URI.
   * @override
   */
  load() {
    if (this.state == ImageState.IDLE) {
      this.state = ImageState.LOADING;
      this.changed();
      this.loader_(this.handleLoad_.bind(this));
    }
  }

  /**
   * @return {HTMLCanvasElement} Canvas element.
   * @override
   */
  getImage() {
    return this.canvas_;
  }
}

export default ImageCanvas;
