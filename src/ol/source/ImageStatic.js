/**
 * @module ol/source/ImageStatic
 */

import EventType from '../events/EventType.js';
import ImageSource, {defaultImageLoadFunction} from './Image.js';
import ImageWrapper from '../Image.js';
import {createCanvasContext2D} from '../dom.js';
import {getHeight, getWidth, intersects} from '../extent.js';
import {get as getProjection} from '../proj.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {import("../extent.js").Extent} [imageExtent] Extent of the image in map coordinates.
 * This is the [left, bottom, right, top] map coordinates of your image.
 * @property {import("../Image.js").LoadFunction} [imageLoadFunction] Optional function to load an image given a URL.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {import("../size.js").Size} [imageSize] Size of the image in pixels.  If specified the image will be drawn to a canvas
 * of at least this width and height after being scaled to match the aspect ratio of the `imageExtent`.  For images with a very large
 * natural size specify a smaller size if browser canvas limits may become an issue.  For SVG images with a samll natural size specify
 * a larger size to render the SVG in more detail.
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
    const crossOrigin =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

    const /** @type {import("../Image.js").LoadFunction} */ imageLoadFunction =
        options.imageLoadFunction !== undefined
          ? options.imageLoadFunction
          : defaultImageLoadFunction;

    super({
      attributions: options.attributions,
      interpolate: options.interpolate,
      projection: getProjection(options.projection),
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
    this.image_ = new ImageWrapper(
      this.imageExtent_,
      undefined,
      1,
      this.url_,
      crossOrigin,
      imageLoadFunction,
      undefined,
      this.resize_.bind(this)
    );

    /**
     * @private
     * @type {import("../size.js").Size|null}
     */
    this.imageSize_ = options.imageSize ? options.imageSize : null;

    this.image_.addEventListener(
      EventType.CHANGE,
      this.handleImageChange.bind(this)
    );
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
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../Image.js").default} Single image.
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
   * @private
   * @param {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} image Image.
   */
  resize_(image) {
    const imageExtent = this.image_.getExtent();
    let imageWidth, imageHeight;
    if (this.imageSize_) {
      imageWidth = this.imageSize_[0];
      imageHeight = this.imageSize_[1];
    } else {
      imageWidth = image.width;
      imageHeight = image.height;
    }
    const extentWidth = getWidth(imageExtent);
    const extentHeight = getHeight(imageExtent);
    const xResolution = extentWidth / imageWidth;
    const yResolution = extentHeight / imageHeight;
    let targetWidth = imageWidth;
    let targetHeight = imageHeight;
    if (xResolution > yResolution) {
      targetWidth = Math.round(extentWidth / yResolution);
    } else {
      targetHeight = Math.round(extentHeight / xResolution);
    }
    const context = createCanvasContext2D(targetWidth, targetHeight);
    if (!this.getInterpolate()) {
      context.imageSmoothingEnabled = false;
    }
    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    this.image_.setImage(context.canvas);
  }
}

export default Static;
