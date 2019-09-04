/**
 * @module ol/source/ImageMapGuide
 */

import ImageWrapper from '../Image.js';
import EventType from '../events/EventType.js';
import {containsExtent, getCenter, getHeight, getWidth, scaleFromCenter} from '../extent.js';
import {assign} from '../obj.js';
import ImageSource, {defaultImageLoadFunction} from './Image.js';
import {appendParams} from '../uri.js';

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
 * @property {import("../proj.js").ProjectionLike} projection Projection.
 * @property {number} [ratio=1] Ratio. `1` means image requests are the size of the map viewport, `2` means
 * twice the width and height of the map viewport, and so on. Must be `1` or higher.
 * @property {Array<number>} [resolutions] Resolutions.
 * If specified, requests will be made for these resolutions only.
 * @property {import("../Image.js").LoadFunction} [imageLoadFunction] Optional function to load an image given a URL.
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
     * @type {number}
     */
    this.displayDpi_ = options.displayDpi !== undefined ?
      options.displayDpi : 96;

    /**
     * @private
     * @type {!Object}
     */
    this.params_ = options.params || {};

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
     * @type {boolean}
     */
    this.hidpi_ = options.hidpi !== undefined ? options.hidpi : true;

    /**
     * @private
     * @type {number}
     */
    this.metersPerUnit_ = options.metersPerUnit !== undefined ?
      options.metersPerUnit : 1;

    /**
     * @private
     * @type {number}
     */
    this.ratio_ = options.ratio !== undefined ? options.ratio : 1;

    /**
     * @private
     * @type {boolean}
     */
    this.useOverlay_ = options.useOverlay !== undefined ?
      options.useOverlay : false;

    /**
     * @private
     * @type {import("../Image.js").default}
     */
    this.image_ = null;

    /**
     * @private
     * @type {number}
     */
    this.renderedRevision_ = 0;

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
    resolution = this.findNearestResolution(resolution);
    pixelRatio = this.hidpi_ ? pixelRatio : 1;

    let image = this.image_;
    if (image &&
        this.renderedRevision_ == this.getRevision() &&
        image.getResolution() == resolution &&
        image.getPixelRatio() == pixelRatio &&
        containsExtent(image.getExtent(), extent)) {
      return image;
    }

    if (this.ratio_ != 1) {
      extent = extent.slice();
      scaleFromCenter(extent, this.ratio_);
    }
    const width = getWidth(extent) / resolution;
    const height = getHeight(extent) / resolution;
    const size = [width * pixelRatio, height * pixelRatio];

    if (this.url_ !== undefined) {
      const imageUrl = this.getUrl(this.url_, this.params_, extent, size,
        projection);
      image = new ImageWrapper(extent, resolution, pixelRatio,
        imageUrl, this.crossOrigin_,
        this.imageLoadFunction_);
      image.addEventListener(EventType.CHANGE, this.handleImageChange.bind(this));
    } else {
      image = null;
    }
    this.image_ = image;
    this.renderedRevision_ = this.getRevision();

    return image;
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
    assign(this.params_, params);
    this.changed();
  }

  /**
   * @param {string} baseUrl The mapagent url.
   * @param {Object<string, string|number>} params Request parameters.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {import("../size.js").Size} size Size.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {string} The mapagent map image request URL.
   */
  getUrl(baseUrl, params, extent, size, projection) {
    const scale = getScale(extent, size,
      this.metersPerUnit_, this.displayDpi_);
    const center = getCenter(extent);
    const baseParams = {
      'OPERATION': this.useOverlay_ ? 'GETDYNAMICMAPOVERLAYIMAGE' : 'GETMAPIMAGE',
      'VERSION': '2.0.0',
      'LOCALE': 'en',
      'CLIENTAGENT': 'ol/source/ImageMapGuide source',
      'CLIP': '1',
      'SETDISPLAYDPI': this.displayDpi_,
      'SETDISPLAYWIDTH': Math.round(size[0]),
      'SETDISPLAYHEIGHT': Math.round(size[1]),
      'SETVIEWSCALE': scale,
      'SETVIEWCENTERX': center[0],
      'SETVIEWCENTERY': center[1]
    };
    assign(baseParams, params);
    return appendParams(baseUrl, baseParams);
  }

  /**
   * Set the image load function of the MapGuide source.
   * @param {import("../Image.js").LoadFunction} imageLoadFunction Image load function.
   * @api
   */
  setImageLoadFunction(imageLoadFunction) {
    this.image_ = null;
    this.imageLoadFunction_ = imageLoadFunction;
    this.changed();
  }
}


/**
 * @param {import("../extent.js").Extent} extent The map extents.
 * @param {import("../size.js").Size} size The viewport size.
 * @param {number} metersPerUnit The meters-per-unit value.
 * @param {number} dpi The display resolution.
 * @return {number} The computed map scale.
 */
function getScale(extent, size, metersPerUnit, dpi) {
  const mcsW = getWidth(extent);
  const mcsH = getHeight(extent);
  const devW = size[0];
  const devH = size[1];
  const mpp = 0.0254 / dpi;
  if (devH * mcsW > devW * mcsH) {
    return mcsW * metersPerUnit / (devW * mpp); // width limited
  } else {
    return mcsH * metersPerUnit / (devH * mpp); // height limited
  }
}


export default ImageMapGuide;
