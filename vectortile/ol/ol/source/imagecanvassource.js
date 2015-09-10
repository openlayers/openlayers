goog.provide('ol.source.ImageCanvas');

goog.require('ol.CanvasFunctionType');
goog.require('ol.ImageCanvas');
goog.require('ol.extent');
goog.require('ol.source.Image');



/**
 * @classdesc
 * Base class for image sources where a canvas element is the image.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageCanvasOptions} options
 * @api
 */
ol.source.ImageCanvas = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: options.projection,
    resolutions: options.resolutions,
    state: goog.isDef(options.state) ?
        /** @type {ol.source.State} */ (options.state) : undefined
  });

  /**
   * @private
   * @type {ol.CanvasFunctionType}
   */
  this.canvasFunction_ = options.canvasFunction;

  /**
   * @private
   * @type {ol.ImageCanvas}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.ratio_ = goog.isDef(options.ratio) ?
      options.ratio : 1.5;

};
goog.inherits(ol.source.ImageCanvas, ol.source.Image);


/**
 * @inheritDoc
 */
ol.source.ImageCanvas.prototype.getImage =
    function(extent, resolution, pixelRatio, projection) {
  resolution = this.findNearestResolution(resolution);

  var canvas = this.canvas_;
  if (!goog.isNull(canvas) &&
      this.renderedRevision_ == this.getRevision() &&
      canvas.getResolution() == resolution &&
      canvas.getPixelRatio() == pixelRatio &&
      ol.extent.containsExtent(canvas.getExtent(), extent)) {
    return canvas;
  }

  extent = extent.slice();
  ol.extent.scaleFromCenter(extent, this.ratio_);
  var width = ol.extent.getWidth(extent) / resolution;
  var height = ol.extent.getHeight(extent) / resolution;
  var size = [width * pixelRatio, height * pixelRatio];

  var canvasElement = this.canvasFunction_(
      extent, resolution, pixelRatio, size, projection);
  if (!goog.isNull(canvasElement)) {
    canvas = new ol.ImageCanvas(extent, resolution, pixelRatio,
        this.getAttributions(), canvasElement);
  }
  this.canvas_ = canvas;
  this.renderedRevision_ = this.getRevision();

  return canvas;
};
