/**
 * @module ol/source/ImageStatic
 */

import ImageWrapper from '../Image.js';
import ImageState from '../ImageState.js';
import {createCanvasContext2D} from '../dom.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';
import {intersects, getHeight, getWidth} from '../extent.js';
import {get as getProjection} from '../proj.js';
import ImageSource, {defaultImageLoadFunction} from './Image.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {import("../extent.js").Extent} [imageExtent] Extent of the image in map coordinates.
 * This is the [left, bottom, right, top] map coordinates of your image.
 * @property {import("../Image.js").LoadFunction} [imageLoadFunction] Optional function to load an image given a URL.
 * @property {import("../proj.js").ProjectionLike} projection Projection.
 * @property {import("../size.js").Size} [imageSize] Size of the image in pixels. Usually the image size is auto-detected, so this
 * only needs to be set if auto-detection fails for some reason.
 * @property {string} url Image URL.
 */


/**
 * @classdesc
 * A layer source for displaying a single, static image.
 * @api
 */
class Static extends ImageSource {
  /**
   * @param {Options} options ImageStatic options.
   */
  constructor(options) {
    const crossOrigin = options.crossOrigin !== undefined ?
      options.crossOrigin : null;

    const /** @type {import("../Image.js").LoadFunction} */ imageLoadFunction =
        options.imageLoadFunction !== undefined ?
          options.imageLoadFunction : defaultImageLoadFunction;

    super({
      attributions: options.attributions,
      projection: getProjection(options.projection)
    });

    /**
     * @private
     * @type {string}
     */
    this.url_ = options.url;

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.imageExtent_ = options.imageExtent;

    /**
     * @private
     * @type {import("../Image.js").default}
     */
    this.image_ = new ImageWrapper(this.imageExtent_, undefined, 1, this.url_, crossOrigin, imageLoadFunction);

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.imageSize_ = options.imageSize ? options.imageSize : null;

    listen(this.image_, EventType.CHANGE,
      this.handleImageChange, this);

  }

  /**
   * Returns the image extent
   * @return {import("../extent.js").Extent} image extent.
   * @api
   */
  getImageExtent() {
    return this.imageExtent_;
  }

  /**
   * @inheritDoc
   */
  getImageInternal(extent, resolution, pixelRatio, projection) {
    if (intersects(extent, this.image_.getExtent())) {
      return this.image_;
    }
    return null;
  }

  /**
   * Return the URL used for this image source.
   * @return {string} URL.
   * @api
   */
  getUrl() {
    return this.url_;
  }

  /**
   * @inheritDoc
   */
  handleImageChange(evt) {
    if (this.image_.getState() == ImageState.LOADED) {
      const imageExtent = this.image_.getExtent();
      const image = this.image_.getImage();
      let imageWidth, imageHeight;
      if (this.imageSize_) {
        imageWidth = this.imageSize_[0];
        imageHeight = this.imageSize_[1];
      } else {
        imageWidth = image.width;
        imageHeight = image.height;
      }
      const resolution = getHeight(imageExtent) / imageHeight;
      const targetWidth = Math.ceil(getWidth(imageExtent) / resolution);
      if (targetWidth != imageWidth) {
        const context = createCanvasContext2D(targetWidth, imageHeight);
        const canvas = context.canvas;
        context.drawImage(image, 0, 0, imageWidth, imageHeight,
          0, 0, canvas.width, canvas.height);
        this.image_.setImage(canvas);
      }
    }
    super.handleImageChange(evt);
  }
}


export default Static;
