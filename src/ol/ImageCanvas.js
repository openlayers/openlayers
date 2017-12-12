/**
 * @module ol/ImageCanvas
 */
import {inherits} from './index.js';
import _ol_ImageBase_ from './ImageBase.js';
import _ol_ImageState_ from './ImageState.js';

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
var _ol_ImageCanvas_ = function(extent, resolution, pixelRatio, canvas, opt_loader) {

  /**
   * Optional canvas loader function.
   * @type {?ol.ImageCanvasLoader}
   * @private
   */
  this.loader_ = opt_loader !== undefined ? opt_loader : null;

  var state = opt_loader !== undefined ?
    _ol_ImageState_.IDLE : _ol_ImageState_.LOADED;

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

inherits(_ol_ImageCanvas_, _ol_ImageBase_);


/**
 * Get any error associated with asynchronous rendering.
 * @return {Error} Any error that occurred during rendering.
 */
_ol_ImageCanvas_.prototype.getError = function() {
  return this.error_;
};


/**
 * Handle async drawing complete.
 * @param {Error} err Any error during drawing.
 * @private
 */
_ol_ImageCanvas_.prototype.handleLoad_ = function(err) {
  if (err) {
    this.error_ = err;
    this.state = _ol_ImageState_.ERROR;
  } else {
    this.state = _ol_ImageState_.LOADED;
  }
  this.changed();
};


/**
 * @inheritDoc
 */
_ol_ImageCanvas_.prototype.load = function() {
  if (this.state == _ol_ImageState_.IDLE) {
    this.state = _ol_ImageState_.LOADING;
    this.changed();
    this.loader_(this.handleLoad_.bind(this));
  }
};


/**
 * @inheritDoc
 */
_ol_ImageCanvas_.prototype.getImage = function() {
  return this.canvas_;
};
export default _ol_ImageCanvas_;
