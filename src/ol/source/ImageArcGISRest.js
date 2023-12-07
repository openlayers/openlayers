/**
 * @module ol/source/ImageArcGISRest
 */

import ImageSource, {defaultImageLoadFunction} from './Image.js';
import {createLoader} from './arcgisRest.js';
import {decode} from '../Image.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {boolean} [hidpi=true] Use the `ol/Map#pixelRatio` value when requesting the image from
 * the remote server.
 * @property {import("../Image.js").LoadFunction} [imageLoadFunction] Optional function to load an image given
 * a URL.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {Object<string,*>} [params] ArcGIS Rest parameters. This field is optional. Service
 * defaults will be used for any fields not specified. `FORMAT` is `PNG32` by default. `F` is
 * `IMAGE` by default. `TRANSPARENT` is `true` by default.  `BBOX`, `SIZE`, `BBOXSR`, and `IMAGESR`
 * will be set dynamically. Set `LAYERS` to override the default service layer visibility. See
 * https://developers.arcgis.com/rest/services-reference/export-map.htm
 * for further reference.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * The projection code must contain a numeric end portion separated by :
 * or the entire code must form a valid ArcGIS SpatialReference definition.
 * @property {number} [ratio=1.5] Ratio. `1` means image requests are the size of the map viewport,
 * `2` means twice the size of the map viewport, and so on.
 * @property {Array<number>} [resolutions] Resolutions. If specified, requests will be made for
 * these resolutions only.
 * @property {string} [url] ArcGIS Rest service URL for a Map Service or Image Service. The url
 * should include /MapServer or /ImageServer.
 */

/**
 * @classdesc
 * Source for data from ArcGIS Rest services providing single, untiled images.
 * Useful when underlying map service has labels.
 *
 * If underlying map service is not using labels,
 * take advantage of ol image caching and use
 * {@link module:ol/source/TileArcGISRest~TileArcGISRest} data source.
 *
 * @fires module:ol/source/Image.ImageSourceEvent
 * @api
 */
class ImageArcGISRest extends ImageSource {
  /**
   * @param {Options} [options] Image ArcGIS Rest Options.
   */
  constructor(options) {
    options = options ? options : {};

    super({
      attributions: options.attributions,
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
     * @type {boolean}
     */
    this.hidpi_ = options.hidpi !== undefined ? options.hidpi : true;

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
     * @type {!Object}
     */
    this.params_ = Object.assign({}, options.params);

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.imageSize_ = [0, 0];

    /**
     * @private
     * @type {number}
     */
    this.renderedRevision_ = 0;

    /**
     * @private
     * @type {number}
     */
    this.ratio_ = options.ratio !== undefined ? options.ratio : 1.5;

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
        projection: projection,
        hidpi: this.hidpi_,
        url: this.url_,
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
   * Return the URL used for this ArcGIS source.
   * @return {string|undefined} URL.
   * @api
   */
  getUrl() {
    return this.url_;
  }

  /**
   * Set the image load function of the source.
   * @param {import("../Image.js").LoadFunction} imageLoadFunction Image load function.
   * @api
   */
  setImageLoadFunction(imageLoadFunction) {
    this.imageLoadFunction_ = imageLoadFunction;
    this.changed();
  }

  /**
   * Set the URL to use for requests.
   * @param {string|undefined} url URL.
   * @api
   */
  setUrl(url) {
    if (url != this.url_) {
      this.url_ = url;
      this.loader = null;
      this.changed();
    }
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

  changed() {
    this.image = null;
    super.changed();
  }
}

export default ImageArcGISRest;
