/**
 * @module ol/source/Image
 */
import Event from '../events/Event.js';
import ImageState from '../ImageState.js';
import ReprojImage from '../reproj/Image.js';
import Source from './Source.js';
import {ENABLE_RASTER_REPROJECTION} from '../reproj/common.js';
import {abstract} from '../util.js';
import {equals} from '../extent.js';
import {equivalent} from '../proj.js';
import {linearFindNearest} from '../array.js';

/**
 * @enum {string}
 */
export const ImageSourceEventType = {
  /**
   * Triggered when an image starts loading.
   * @event module:ol/source/Image.ImageSourceEvent#imageloadstart
   * @api
   */
  IMAGELOADSTART: 'imageloadstart',

  /**
   * Triggered when an image finishes loading.
   * @event module:ol/source/Image.ImageSourceEvent#imageloadend
   * @api
   */
  IMAGELOADEND: 'imageloadend',

  /**
   * Triggered if image loading results in an error.
   * @event module:ol/source/Image.ImageSourceEvent#imageloaderror
   * @api
   */
  IMAGELOADERROR: 'imageloaderror',
};

/**
 * @typedef {'imageloadend'|'imageloaderror'|'imageloadstart'} ImageSourceEventTypes
 */

/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Image~ImageSource} instances are instances of this
 * type.
 */
export class ImageSourceEvent extends Event {
  /**
   * @param {string} type Type.
   * @param {import("../Image.js").default} image The image.
   */
  constructor(type, image) {
    super(type);

    /**
     * The image related to the event.
     * @type {import("../Image.js").default}
     * @api
     */
    this.image = image;
  }
}

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<ImageSourceEventTypes, ImageSourceEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types
 *     |ImageSourceEventTypes, Return>} ImageSourceOnSignature
 */

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [imageSmoothing=true] Deprecated.  Use the `interpolate` option instead.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection.
 * @property {Array<number>} [resolutions] Resolutions.
 * @property {import("./Source.js").State} [state] State.
 */

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for sources providing a single image.
 * @abstract
 * @fires module:ol/source/Image.ImageSourceEvent
 * @api
 */
class ImageSource extends Source {
  /**
   * @param {Options} options Single image source options.
   */
  constructor(options) {
    let interpolate =
      options.imageSmoothing !== undefined ? options.imageSmoothing : true;
    if (options.interpolate !== undefined) {
      interpolate = options.interpolate;
    }

    super({
      attributions: options.attributions,
      projection: options.projection,
      state: options.state,
      interpolate: interpolate,
    });

    /***
     * @type {ImageSourceOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {ImageSourceOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {ImageSourceOnSignature<void>}
     */
    this.un;

    /**
     * @private
     * @type {Array<number>|null}
     */
    this.resolutions_ =
      options.resolutions !== undefined ? options.resolutions : null;

    /**
     * @private
     * @type {import("../reproj/Image.js").default}
     */
    this.reprojectedImage_ = null;

    /**
     * @private
     * @type {number}
     */
    this.reprojectedRevision_ = 0;
  }

  /**
   * @return {Array<number>|null} Resolutions.
   */
  getResolutions() {
    return this.resolutions_;
  }

  /**
   * @protected
   * @param {number} resolution Resolution.
   * @return {number} Resolution.
   */
  findNearestResolution(resolution) {
    if (this.resolutions_) {
      const idx = linearFindNearest(this.resolutions_, resolution, 0);
      resolution = this.resolutions_[idx];
    }
    return resolution;
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../ImageBase.js").default} Single image.
   */
  getImage(extent, resolution, pixelRatio, projection) {
    const sourceProjection = this.getProjection();
    if (
      !ENABLE_RASTER_REPROJECTION ||
      !sourceProjection ||
      !projection ||
      equivalent(sourceProjection, projection)
    ) {
      if (sourceProjection) {
        projection = sourceProjection;
      }
      return this.getImageInternal(extent, resolution, pixelRatio, projection);
    } else {
      if (this.reprojectedImage_) {
        if (
          this.reprojectedRevision_ == this.getRevision() &&
          equivalent(this.reprojectedImage_.getProjection(), projection) &&
          this.reprojectedImage_.getResolution() == resolution &&
          equals(this.reprojectedImage_.getExtent(), extent)
        ) {
          return this.reprojectedImage_;
        }
        this.reprojectedImage_.dispose();
        this.reprojectedImage_ = null;
      }

      this.reprojectedImage_ = new ReprojImage(
        sourceProjection,
        projection,
        extent,
        resolution,
        pixelRatio,
        function (extent, resolution, pixelRatio) {
          return this.getImageInternal(
            extent,
            resolution,
            pixelRatio,
            sourceProjection
          );
        }.bind(this),
        this.getInterpolate()
      );
      this.reprojectedRevision_ = this.getRevision();

      return this.reprojectedImage_;
    }
  }

  /**
   * @abstract
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../ImageBase.js").default} Single image.
   * @protected
   */
  getImageInternal(extent, resolution, pixelRatio, projection) {
    return abstract();
  }

  /**
   * Handle image change events.
   * @param {import("../events/Event.js").default} event Event.
   * @protected
   */
  handleImageChange(event) {
    const image = /** @type {import("../Image.js").default} */ (event.target);
    let type;
    switch (image.getState()) {
      case ImageState.LOADING:
        this.loading = true;
        type = ImageSourceEventType.IMAGELOADSTART;
        break;
      case ImageState.LOADED:
        this.loading = false;
        type = ImageSourceEventType.IMAGELOADEND;
        break;
      case ImageState.ERROR:
        this.loading = false;
        type = ImageSourceEventType.IMAGELOADERROR;
        break;
      default:
        return;
    }
    if (this.hasListener(type)) {
      this.dispatchEvent(new ImageSourceEvent(type, image));
    }
  }
}

/**
 * Default image load function for image sources that use import("../Image.js").Image image
 * instances.
 * @param {import("../Image.js").default} image Image.
 * @param {string} src Source.
 */
export function defaultImageLoadFunction(image, src) {
  /** @type {HTMLImageElement|HTMLVideoElement} */ (image.getImage()).src = src;
}

export default ImageSource;
