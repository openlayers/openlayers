/**
 * @module ol/source/ImageMapGuide
 */

import ImageSource, {defaultImageLoadFunction} from './Image.js';
import {createLoader} from './mapguide.js';
import {decode} from '../Image.js';

/**
 * @typedef {Object} Options
 * @property {string} [url] The mapagent url.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {number} [displayDpi=96] The display resolution.
 * @property {number} [metersPerUnit=1] The meters-per-unit value.
 * @property {boolean} [hidpi=true] Use the `ol/Map#pixelRatio` value when requesting
 * the image from the remote server.
 * @property {boolean} [useOverlay] If `true`, will use `GETDYNAMICMAPOVERLAYIMAGE`.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {number} [ratio=1] Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or higher.
 * @property {Array<number>} [resolutions] Resolutions.
 * If specified, requests will be made for these resolutions only.
 * @property {import("../Image.js").LoadFunction} [imageLoadFunction] Optional function to load an image given a URL.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {Object} [params] Additional parameters.
 */

/**
 * @classdesc
 * Source for images from Mapguide servers
 *
 * @fires module:ol/source/Image.ImageSourceEvent
 * @api
 */
class ImageMapGuide extends ImageSource {
  /**
   * @param {Options} options ImageMapGuide options.
   */
  constructor(options) {
    super({
      interpolate: options.interpolate,
      projection: options.projection,
      resolutions: options.resolutions,
    });

    /**
     * @private
     * @type {?string}
     */
    this.crossOrigin_ =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

    /**
     * @private
     * @type {number}
     */
    this.displayDpi_ =
      options.displayDpi !== undefined ? options.displayDpi : 96;

    /**
     * @private
     * @type {!Object}
     */
    this.params_ = Object.assign({}, options.params);

    /**
     * @private
     * @type {string|undefined}
     */
    this.url_ = options.url;

    /**
     * @private
     * @type {import("../Image.js").LoadFunction}
     */
    this.imageLoadFunction_ =
      options.imageLoadFunction !== undefined
        ? options.imageLoadFunction
        : defaultImageLoadFunction;

    /**
     * @private
     * @type {boolean}
     */
    this.hidpi_ = options.hidpi !== undefined ? options.hidpi : true;

    /**
     * @private
     * @type {number}
     */
    this.metersPerUnit_ =
      options.metersPerUnit !== undefined ? options.metersPerUnit : 1;

    /**
     * @private
     * @type {number}
     */
    this.ratio_ = options.ratio !== undefined ? options.ratio : 1;

    /**
     * @private
     * @type {boolean}
     */
    this.useOverlay_ =
      options.useOverlay !== undefined ? options.useOverlay : false;

    /**
     * @private
     * @type {number}
     */
    this.renderedRevision_ = 0;

    /**
     * @private
     * @type {import("../proj/Projection.js").default}
     */
    this.loaderProjection_ = null;
  }

  /**
   * Get the user-provided params, i.e. those passed to the constructor through
   * the "params" option, and possibly updated using the updateParams method.
   * @return {Object} Params.
   * @api
   */
  getParams() {
    return this.params_;
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../Image.js").default} Single image.
   * @override
   */
  getImageInternal(extent, resolution, pixelRatio, projection) {
    if (this.url_ === undefined) {
      return null;
    }
    if (!this.loader || this.loaderProjection_ !== projection) {
      // Lazily create loader to pick up the view projection and to allow `params` updates
      this.loaderProjection_ = projection;
      this.loader = createLoader({
        crossOrigin: this.crossOrigin_,
        params: this.params_,
        hidpi: this.hidpi_,
        metersPerUnit: this.metersPerUnit_,
        url: this.url_,
        useOverlay: this.useOverlay_,
        ratio: this.ratio_,
        load: (image, src) => {
          this.image.setImage(image);
          this.imageLoadFunction_(this.image, src);
          return decode(image);
        },
      });
    }

    return super.getImageInternal(extent, resolution, pixelRatio, projection);
  }

  /**
   * Return the image load function of the source.
   * @return {import("../Image.js").LoadFunction} The image load function.
   * @api
   */
  getImageLoadFunction() {
    return this.imageLoadFunction_;
  }

  /**
   * Update the user-provided params.
   * @param {Object} params Params.
   * @api
   */
  updateParams(params) {
    Object.assign(this.params_, params);
    this.changed();
  }

  /**
   * Set the image load function of the MapGuide source.
   * @param {import("../Image.js").LoadFunction} imageLoadFunction Image load function.
   * @api
   */
  setImageLoadFunction(imageLoadFunction) {
    this.imageLoadFunction_ = imageLoadFunction;
    this.changed();
  }

  /**
   * @override
   */
  changed() {
    this.image = null;
    super.changed();
  }
}

export default ImageMapGuide;
