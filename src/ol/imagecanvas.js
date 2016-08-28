goog.provide('ol.ImageCanvas');

goog.require('ol');
goog.require('ol.Image');
goog.require('ol.ImageBase');


/**
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Array.<ol.Attribution>} attributions Attributions.
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {ol.ImageCanvasLoader=} opt_loader Optional loader function to
 *     support asynchronous canvas drawing.
 */
ol.ImageCanvas = function(extent, resolution, pixelRatio, attributions,
    canvas, opt_loader) {

  /**
   * Optional canvas loader function.
   * @type {?ol.ImageCanvasLoader}
   * @private
   */
  this.loader_ = opt_loader !== undefined ? opt_loader : null;

  var state = opt_loader !== undefined ?
      ol.Image.State.IDLE : ol.Image.State.LOADED;

  ol.ImageBase.call(this, extent, resolution, pixelRatio, state, attributions);

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
ol.inherits(ol.ImageCanvas, ol.ImageBase);


/**
 * Get any error associated with asynchronous rendering.
 * @return {Error} Any error that occurred during rendering.
 */
ol.ImageCanvas.prototype.getError = function() {
  return this.error_;
};


/**
 * Handle async drawing complete.
 * @param {Error} err Any error during drawing.
 * @private
 */
ol.ImageCanvas.prototype.handleLoad_ = function(err) {
  if (err) {
    this.error_ = err;
    this.state = ol.Image.State.ERROR;
  } else {
    this.state = ol.Image.State.LOADED;
  }
  this.changed();
};


/**
 * Trigger drawing on canvas.
 */
ol.ImageCanvas.prototype.load = function() {
  if (this.state == ol.Image.State.IDLE) {
    ol.DEBUG && console.assert(this.loader_, 'this.loader_ must be set');
    this.state = ol.Image.State.LOADING;
    this.changed();
    this.loader_(this.handleLoad_.bind(this));
  }
};


/**
 * @inheritDoc
 */
ol.ImageCanvas.prototype.getImage = function(opt_context) {
  return this.canvas_;
};
