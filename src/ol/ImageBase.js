/**
 * @module ol/ImageBase
 */
import EventTarget from './events/Target.js';
import EventType from './events/EventType.js';

/**
 * @abstract
 */
class ImageBase extends EventTarget {

  /**
   * @param {module:ol/extent~Extent} extent Extent.
   * @param {number|undefined} resolution Resolution.
   * @param {number} pixelRatio Pixel ratio.
   * @param {module:ol/ImageState} state State.
   */
  constructor(extent, resolution, pixelRatio, state) {

    super();

    /**
     * @protected
     * @type {module:ol/extent~Extent}
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
     * @type {module:ol/ImageState}
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
   * @return {module:ol/extent~Extent} Extent.
   */
  getExtent() {
    return this.extent;
  }

  /**
   * @abstract
   * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
   */
  getImage() {}

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
   * @return {module:ol/ImageState} State.
   */
  getState() {
    return this.state;
  }

  /**
   * Load not yet loaded URI.
   * @abstract
   */
  load() {}
}


export default ImageBase;
