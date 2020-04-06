/**
 * @module ol/ImageBase
 */
import EventTarget from './events/Target.js';
import EventType from './events/EventType.js';
import {abstract} from './util.js';

/**
 * @abstract
 */
class ImageBase extends EventTarget {
  /**
   * @param {import("./extent.js").Extent} extent Extent.
   * @param {number|undefined} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("./ImageState.js").default} state State.
   */
  constructor(extent, resolution, pixelRatio, state) {
    super();

    /**
     * @protected
     * @type {import("./extent.js").Extent}
     */
    this.extent = extent;

    /**
     * @private
     * @type {number}
     */
    this.pixelRatio_ = pixelRatio;

    /**
     * @protected
     * @type {number|undefined}
     */
    this.resolution = resolution;

    /**
     * @protected
     * @type {import("./ImageState.js").default}
     */
    this.state = state;
  }

  /**
   * @protected
   */
  changed() {
    this.dispatchEvent(EventType.CHANGE);
  }

  /**
   * @return {import("./extent.js").Extent} Extent.
   */
  getExtent() {
    return this.extent;
  }

  /**
   * @abstract
   * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
   */
  getImage() {
    return abstract();
  }

  /**
   * @return {number} PixelRatio.
   */
  getPixelRatio() {
    return this.pixelRatio_;
  }

  /**
   * @return {number} Resolution.
   */
  getResolution() {
    return /** @type {number} */ (this.resolution);
  }

  /**
   * @return {import("./ImageState.js").default} State.
   */
  getState() {
    return this.state;
  }

  /**
   * Load not yet loaded URI.
   * @abstract
   */
  load() {
    abstract();
  }
}

export default ImageBase;
