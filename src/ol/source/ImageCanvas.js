/**
 * @module ol/source/ImageCanvas
 */

import ImageCanvas from '../ImageCanvas.js';
import {containsExtent, getHeight, getWidth, scaleFromCenter} from '../extent.js';
import ImageSource from './Image.js';


/**
 * A function returning the canvas element (`{HTMLCanvasElement}`)
 * used by the source as an image. The arguments passed to the function are:
 * {@link module:ol/extent~Extent} the image extent, `{number}` the image resolution,
 * `{number}` the device pixel ratio, {@link module:ol/size~Size} the image size, and
 * {@link module:ol/proj/Projection} the image projection. The canvas returned by
 * this function is cached by the source. The this keyword inside the function
 * references the {@link module:ol/source/ImageCanvas}.
 *
 * @typedef {function(this:import("../ImageCanvas.js").default, import("../extent.js").Extent, number,
 *     number, import("../size.js").Size, import("../proj/Projection.js").default): HTMLCanvasElement} FunctionType
 */


/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {FunctionType} [canvasFunction] Canvas function.
 * The function returning the canvas element used by the source
 * as an image. The arguments passed to the function are: `{import("../extent.js").Extent}` the
 * image extent, `{number}` the image resolution, `{number}` the device pixel
 * ratio, `{import("../size.js").Size}` the image size, and `{import("../proj/Projection.js").Projection}` the image
 * projection. The canvas returned by this function is cached by the source. If
 * the value returned by the function is later changed then
 * `changed` should be called on the source for the source to
 * invalidate the current cached image. See: {@link module:ol/Observable~Observable#changed}
 * @property {import("../proj.js").ProjectionLike} projection Projection.
 * @property {number} [ratio=1.5] Ratio. 1 means canvases are the size of the map viewport, 2 means twice the
 * width and height of the map viewport, and so on. Must be `1` or higher.
 * @property {Array<number>} [resolutions] Resolutions.
 * If specified, new canvases will be created for these resolutions
 * @property {import("./State.js").default} [state] Source state.
 */


/**
 * @classdesc
 * Base class for image sources where a canvas element is the image.
 * @api
 */
class ImageCanvasSource extends ImageSource {
  /**
   * @param {Options=} opt_options ImageCanvas options.
   */
  constructor(opt_options) {

    const options = opt_options || /** @type {Options} */ ({});

    super({
      attributions: options.attributions,
      projection: options.projection,
      resolutions: options.resolutions,
      state: options.state
    });

    /**
    * @private
    * @type {FunctionType}
    */
    this.canvasFunction_ = options.canvasFunction;

    /**
    * @private
    * @type {import("../ImageCanvas.js").default}
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

  }

  /**
  * @inheritDoc
  */
  getImageInternal(extent, resolution, pixelRatio, projection) {
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

    const canvasElement = this.canvasFunction_.call(
      this, extent, resolution, pixelRatio, size, projection);
    if (canvasElement) {
      canvas = new ImageCanvas(extent, resolution, pixelRatio, canvasElement);
    }
    this.canvas_ = canvas;
    this.renderedRevision_ = this.getRevision();

    return canvas;
  }
}


export default ImageCanvasSource;
