/**
 * @module ol/source/ImageArcGISRest
 */

import ImageWrapper from '../Image.js';
import {assert} from '../asserts.js';
import EventType from '../events/EventType.js';
import {containsExtent, getHeight, getWidth} from '../extent.js';
import {assign} from '../obj.js';
import ImageSource, {defaultImageLoadFunction} from './Image.js';
import {appendParams} from '../uri.js';


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
 * @property {Object<string,*>} [params] ArcGIS Rest parameters. This field is optional. Service
 * defaults will be used for any fields not specified. `FORMAT` is `PNG32` by default. `F` is
 * `IMAGE` by default. `TRANSPARENT` is `true` by default.  `BBOX`, `SIZE`, `BBOXSR`, and `IMAGESR`
 * will be set dynamically. Set `LAYERS` to override the default service layer visibility. See
 * {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Export_Map/02r3000000v7000000/}
 * for further reference.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
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
 * {@link module:ol/source/TileArcGISRest} data source.
 *
 * @fires module:ol/source/Image.ImageSourceEvent
 * @api
 */
class ImageArcGISRest extends ImageSource {
  /**
   * @param {Options=} opt_options Image ArcGIS Rest Options.
   */
  constructor(opt_options) {

    const options = opt_options ? opt_options : {};

    super({
      attributions: options.attributions,
      projection: options.projection,
      resolutions: options.resolutions
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
    this.imageLoadFunction_ = options.imageLoadFunction !== undefined ?
      options.imageLoadFunction : defaultImageLoadFunction;


    /**
     * @private
     * @type {!Object}
     */
    this.params_ = options.params || {};

    /**
     * @private
     * @type {import("../Image.js").default}
     */
    this.image_ = null;

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
   * @inheritDoc
   */
  getImageInternal(extent, resolution, pixelRatio, projection) {

    if (this.url_ === undefined) {
      return null;
    }

    resolution = this.findNearestResolution(resolution);
    pixelRatio = this.hidpi_ ? pixelRatio : 1;

    const image = this.image_;
    if (image &&
        this.renderedRevision_ == this.getRevision() &&
        image.getResolution() == resolution &&
        image.getPixelRatio() == pixelRatio &&
        containsExtent(image.getExtent(), extent)) {
      return image;
    }

    const params = {
      'F': 'image',
      'FORMAT': 'PNG32',
      'TRANSPARENT': true
    };
    assign(params, this.params_);

    extent = extent.slice();
    const centerX = (extent[0] + extent[2]) / 2;
    const centerY = (extent[1] + extent[3]) / 2;
    if (this.ratio_ != 1) {
      const halfWidth = this.ratio_ * getWidth(extent) / 2;
      const halfHeight = this.ratio_ * getHeight(extent) / 2;
      extent[0] = centerX - halfWidth;
      extent[1] = centerY - halfHeight;
      extent[2] = centerX + halfWidth;
      extent[3] = centerY + halfHeight;
    }

    const imageResolution = resolution / pixelRatio;

    // Compute an integer width and height.
    const width = Math.ceil(getWidth(extent) / imageResolution);
    const height = Math.ceil(getHeight(extent) / imageResolution);

    // Modify the extent to match the integer width and height.
    extent[0] = centerX - imageResolution * width / 2;
    extent[2] = centerX + imageResolution * width / 2;
    extent[1] = centerY - imageResolution * height / 2;
    extent[3] = centerY + imageResolution * height / 2;

    this.imageSize_[0] = width;
    this.imageSize_[1] = height;

    const url = this.getRequestUrl_(extent, this.imageSize_, pixelRatio,
      projection, params);

    this.image_ = new ImageWrapper(extent, resolution, pixelRatio,
      url, this.crossOrigin_, this.imageLoadFunction_);

    this.renderedRevision_ = this.getRevision();

    this.image_.addEventListener(EventType.CHANGE, this.handleImageChange.bind(this));

    return this.image_;

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
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {import("../size.js").Size} size Size.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @param {Object} params Params.
   * @return {string} Request URL.
   * @private
   */
  getRequestUrl_(extent, size, pixelRatio, projection, params) {
    // ArcGIS Server only wants the numeric portion of the projection ID.
    const srid = projection.getCode().split(':').pop();

    params['SIZE'] = size[0] + ',' + size[1];
    params['BBOX'] = extent.join(',');
    params['BBOXSR'] = srid;
    params['IMAGESR'] = srid;
    params['DPI'] = Math.round(90 * pixelRatio);

    const url = this.url_;

    const modifiedUrl = url
      .replace(/MapServer\/?$/, 'MapServer/export')
      .replace(/ImageServer\/?$/, 'ImageServer/exportImage');
    if (modifiedUrl == url) {
      assert(false, 50); // `options.featureTypes` should be an Array
    }
    return appendParams(modifiedUrl, params);
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
    this.image_ = null;
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
      this.image_ = null;
      this.changed();
    }
  }

  /**
   * Update the user-provided params.
   * @param {Object} params Params.
   * @api
   */
  updateParams(params) {
    assign(this.params_, params);
    this.image_ = null;
    this.changed();
  }
}


export default ImageArcGISRest;
