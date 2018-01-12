/**
 * @module ol/source/ImageCanvas
 */
import {inherits} from '../index.js';
import ImageCanvas from '../ImageCanvas.js';
import {containsExtent, getHeight, getWidth, scaleFromCenter} from '../extent.js';
import ImageSource from '../source/Image.js';

/**
 * @classdesc
 * Base class for image sources where a canvas element is the image.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageCanvasOptions} options Constructor options.
 * @api
 */
const ImageCanvasSource = function(options) {

  ImageSource.call(this, {
    attributions: options.attributions,
    projection: options.projection,
    resolutions: options.resolutions,
    state: options.state
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
  this.ratio_ = options.ratio !== undefined ?
    options.ratio : 1.5;

};

inherits(ImageCanvasSource, ImageSource);


/**
 * @inheritDoc
 */
ImageCanvasSource.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  resolution = this.findNearestResolution(resolution);

  let canvas = this.canvas_;
  if (canvas &&
      this.renderedRevision_ == this.getRevision() &&
      canvas.getResolution() == resolution &&
      canvas.getPixelRatio() == pixelRatio &&
      containsExtent(canvas.getExtent(), extent)) {
    return canvas;
  }

  extent = extent.slice();
  scaleFromCenter(extent, this.ratio_);
  const width = getWidth(extent) / resolution;
  const height = getHeight(extent) / resolution;
  const size = [width * pixelRatio, height * pixelRatio];

  const canvasElement = this.canvasFunction_(
    extent, resolution, pixelRatio, size, projection);
  if (canvasElement) {
    canvas = new ImageCanvas(extent, resolution, pixelRatio, canvasElement);
  }
  this.canvas_ = canvas;
  this.renderedRevision_ = this.getRevision();

  return canvas;
};
export default ImageCanvasSource;
