/**
 * @module ol/source/ImageCanvas
 */
import {inherits} from '../util.js';
import ImageCanvas from '../ImageCanvas.js';
import {containsExtent, getHeight, getWidth, scaleFromCenter} from '../extent.js';
import ImageSource from '../source/Image.js';


/**
 * A function returning the canvas element (`{HTMLCanvasElement}`)
 * used by the source as an image. The arguments passed to the function are:
 * {@link module:ol/extent~Extent} the image extent, `{number}` the image resolution,
 * `{number}` the device pixel ratio, {@link module:ol/size~Size} the image size, and
 * {@link module:ol/proj/Projection} the image projection. The canvas returned by
 * this function is cached by the source. The this keyword inside the function
 * references the {@link module:ol/source/ImageCanvas}.
 *
 * @typedef {function(this:module:ol/ImageCanvas, module:ol/extent~Extent, number,
 *     number, module:ol/size~Size, module:ol/proj/Projection): HTMLCanvasElement} FunctionType
 */


/**
 * @typedef {Object} Options
 * @property {module:ol/source/Source~AttributionLike} [attributions] Attributions.
 * @property {module:ol/source/ImageCanvas~FunctionType} [canvasFunction] Canvas function.
 * The function returning the canvas element used by the source
 * as an image. The arguments passed to the function are: `{module:ol/extent~Extent}` the
 * image extent, `{number}` the image resolution, `{number}` the device pixel
 * ratio, `{module:ol/size~Size}` the image size, and `{module:ol/proj/Projection~Projection}` the image
 * projection. The canvas returned by this function is cached by the source. If
 * the value returned by the function is later changed then
 * `changed` should be called on the source for the source to
 * invalidate the current cached image. See @link: {@link module:ol/Observable~Observable#changed}
 * @property {module:ol/proj~ProjectionLike} projection Projection.
 * @property {number} [ratio=1.5] Ratio. 1 means canvases are the size of the map viewport, 2 means twice the
 * width and height of the map viewport, and so on. Must be `1` or higher.
 * @property {Array.<number>} [resolutions] Resolutions.
 * If specified, new canvases will be created for these resolutions
 * @property {module:ol/source/State} [state] Source state.
 */


/**
 * @classdesc
 * Base class for image sources where a canvas element is the image.
 *
 * @constructor
 * @extends {module:ol/source/Image}
 * @param {module:ol/source/ImageCanvas~Options=} options ImageCanvas options.
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
   * @type {module:ol/source/ImageCanvas~FunctionType}
   */
  this.canvasFunction_ = options.canvasFunction;

  /**
   * @private
   * @type {module:ol/ImageCanvas}
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
