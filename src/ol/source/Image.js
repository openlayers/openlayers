/**
 * @module ol/source/Image
 */
import Event from '../events/Event.js';
import EventType from '../events/EventType.js';
import ImageState from '../ImageState.js';
import ImageWrapper from '../Image.js';
import ReprojImage from '../reproj/Image.js';
import Source from './Source.js';
import {DECIMALS} from './common.js';
import {ceil} from '../math.js';
import {
  containsExtent,
  equals,
  getCenter,
  getForViewAndSize,
  getHeight,
  getWidth,
} from '../extent.js';
import {equivalent} from '../proj.js';
import {fromResolutionLike} from '../resolution.js';
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
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {import("../Image.js").Loader} [loader] Loader. Can either be a custom loader, or one of the
 * loaders created with a `createLoader()` function ({@link module:ol/source/wms.createLoader wms},
 * {@link module:ol/source/arcgisRest.createLoader arcgisRest}, {@link module:ol/source/mapguide.createLoader mapguide},
 * {@link module:ol/source/static.createLoader static}).
 * @property {import("../proj.js").ProjectionLike} [projection] Projection.
 * @property {Array<number>} [resolutions] Resolutions.
 * @property {import("./Source.js").State} [state] State.
 */

/**
 * @classdesc
 * Base class for sources providing a single image.
 * @fires module:ol/source/Image.ImageSourceEvent
 * @api
 */
class ImageSource extends Source {
  /**
   * @param {Options} options Single image source options.
   */
  constructor(options) {
    super({
      attributions: options.attributions,
      projection: options.projection,
      state: options.state,
      interpolate:
        options.interpolate !== undefined ? options.interpolate : true,
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
     * @protected
     * @type {import("../Image.js").Loader}
     */
    this.loader = options.loader || null;

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

    /**
     * @protected
     * @type {import("../Image.js").default}
     */
    this.image = null;

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.wantedExtent_;

    /**
     * @private
     * @type {number}
     */
    this.wantedResolution_;

    /**
     * @private
     * @type {boolean}
     */
    this.static_ = options.loader ? options.loader.length === 0 : false;

    /**
     * @private
     * @type {import("../proj/Projection.js").default}
     */
    this.wantedProjection_ = null;
  }

  /**
   * @return {Array<number>|null} Resolutions.
   */
  getResolutions() {
    return this.resolutions_;
  }

  /**
   * @param {Array<number>|null} resolutions Resolutions.
   */
  setResolutions(resolutions) {
    this.resolutions_ = resolutions;
  }

  /**
   * @protected
   * @param {number} resolution Resolution.
   * @return {number} Resolution.
   */
  findNearestResolution(resolution) {
    const resolutions = this.getResolutions();
    if (resolutions) {
      const idx = linearFindNearest(resolutions, resolution, 0);
      resolution = resolutions[idx];
    }
    return resolution;
  }

  /**
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../Image.js").default} Single image.
   */
  getImage(extent, resolution, pixelRatio, projection) {
    const sourceProjection = this.getProjection();
    if (
      !sourceProjection ||
      !projection ||
      equivalent(sourceProjection, projection)
    ) {
      if (sourceProjection) {
        projection = sourceProjection;
      }

      return this.getImageInternal(extent, resolution, pixelRatio, projection);
    }
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
      (extent, resolution, pixelRatio) =>
        this.getImageInternal(extent, resolution, pixelRatio, sourceProjection),
      this.getInterpolate()
    );
    this.reprojectedRevision_ = this.getRevision();

    return this.reprojectedImage_;
  }

  /**
   * @abstract
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../Image.js").default} Single image.
   * @protected
   */
  getImageInternal(extent, resolution, pixelRatio, projection) {
    if (this.loader) {
      const requestExtent = getRequestExtent(extent, resolution, pixelRatio, 1);
      const requestResolution = this.findNearestResolution(resolution);
      if (
        this.image &&
        (this.static_ ||
          (this.wantedProjection_ === projection &&
            ((this.wantedExtent_ &&
              containsExtent(this.wantedExtent_, requestExtent)) ||
              containsExtent(this.image.getExtent(), requestExtent)) &&
            ((this.wantedResolution_ &&
              fromResolutionLike(this.wantedResolution_) ===
                requestResolution) ||
              fromResolutionLike(this.image.getResolution()) ===
                requestResolution)))
      ) {
        return this.image;
      }
      this.wantedProjection_ = projection;
      this.wantedExtent_ = requestExtent;
      this.wantedResolution_ = requestResolution;
      this.image = new ImageWrapper(
        requestExtent,
        requestResolution,
        pixelRatio,
        this.loader
      );
      this.image.addEventListener(
        EventType.CHANGE,
        this.handleImageChange.bind(this)
      );
    }
    return this.image;
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

/**
 * Adjusts the extent so it aligns with pixel boundaries.
 * @param {import("../extent.js").Extent} extent Extent.
 * @param {number} resolution Reolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} ratio Ratio between request size and view size.
 * @return {import("../extent.js").Extent} Request extent.
 */
export function getRequestExtent(extent, resolution, pixelRatio, ratio) {
  const imageResolution = resolution / pixelRatio;
  const center = getCenter(extent);
  const viewWidth = ceil(getWidth(extent) / imageResolution, DECIMALS);
  const viewHeight = ceil(getHeight(extent) / imageResolution, DECIMALS);
  const marginWidth = ceil(((ratio - 1) * viewWidth) / 2, DECIMALS);
  const requestWidth = viewWidth + 2 * marginWidth;
  const marginHeight = ceil(((ratio - 1) * viewHeight) / 2, DECIMALS);
  const requestHeight = viewHeight + 2 * marginHeight;
  return getForViewAndSize(center, imageResolution, 0, [
    requestWidth,
    requestHeight,
  ]);
}

export default ImageSource;
