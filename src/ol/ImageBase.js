/**
 * @module ol/ImageBase
 */
import EventTarget from './events/EventTarget.js';
import EventType from './events/EventType.js';

/**
 * @constructor
 * @abstract
 * @extends {ol.events.EventTarget}
 * @param {ol.Extent} extent Extent.
 * @param {number|undefined} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.ImageState} state State.
 */
class ImageBase extends EventTarget {
  constructor(extent, resolution, pixelRatio, state) {
    super();

    /**
     * @protected
     * @type {ol.Extent}
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
     * @type {ol.ImageState}
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
   * @return {ol.Extent} Extent.
   */
  getExtent() {
    return this.extent;
  }


  /**
   * @abstract
   * @return {HTMLCanvasElement|Image|HTMLVideoElement} Image.
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
   * @return {ol.ImageState} State.
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
