/**
 * @module ol/source/ImageStatic
 */

import EventType from '../events/EventType.js';
import ImageSource, {defaultImageLoadFunction} from './Image.js';
import ImageWrapper, {decode} from '../Image.js';
import {createLoader} from './static.js';
import {get as getProjection} from '../proj.js';
import {intersects} from '../extent.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {import("../extent.js").Extent} imageExtent Extent of the image in map coordinates.
 * This is the [left, bottom, right, top] map coordinates of your image.
 * @property {import("../Image.js").LoadFunction} [imageLoadFunction] Optional function to load an image given a URL.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
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
    this.image = null;

    this.image = new ImageWrapper(
      this.imageExtent_,
      undefined,
      1,
      createLoader({
        url: options.url,
        imageExtent: options.imageExtent,
        crossOrigin,
        load: (image, src) => {
          this.image.setImage(image);
          imageLoadFunction(this.image, src);
          return decode(image);
        },
      })
    );

    this.image.addEventListener(
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
    if (intersects(extent, this.image.getExtent())) {
      return this.image;
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
}

export default Static;
