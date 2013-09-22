goog.provide('ol.ImageCanvas');

goog.require('ol.ImageBase');
goog.require('ol.ImageState');



/**
 * @constructor
 * @extends {ol.ImageBase}
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {Array.<ol.Attribution>} attributions Attributions.
 * @param {HTMLCanvasElement} canvas Canvas.
 */
ol.ImageCanvas = function(extent, resolution, pixelRatio, attributions,
    canvas) {

  goog.base(this, extent, resolution, pixelRatio, ol.ImageState.LOADED,
      attributions);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = canvas;

};
goog.inherits(ol.ImageCanvas, ol.ImageBase);


/**
 * @inheritDoc
 */
ol.ImageCanvas.prototype.getImageElement = function(opt_context) {
  return this.canvas_;
};
