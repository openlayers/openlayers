/**
 * @module ol/ImageBase
 */
import {inherits} from './util.js';
import EventTarget from './events/EventTarget.js';
import EventType from './events/EventType.js';

/**
 * @constructor
 * @abstract
 * @extends {module:ol/events/EventTarget}
 * @param {module:ol/extent~Extent} extent Extent.
 * @param {number|undefined} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {module:ol/ImageState} state State.
 */
const ImageBase = function(extent, resolution, pixelRatio, state) {

  EventTarget.call(this);

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

};

inherits(ImageBase, EventTarget);


/**
 * @protected
 */
ImageBase.prototype.changed = function() {
  this.dispatchEvent(EventType.CHANGE);
};


/**
 * @return {module:ol/extent~Extent} Extent.
 */
ImageBase.prototype.getExtent = function() {
  return this.extent;
};


/**
 * @abstract
 * @return {HTMLCanvasElement|Image|HTMLVideoElement} Image.
 */
ImageBase.prototype.getImage = function() {};


/**
 * @return {number} PixelRatio.
 */
ImageBase.prototype.getPixelRatio = function() {
  return this.pixelRatio_;
};


/**
 * @return {number} Resolution.
 */
ImageBase.prototype.getResolution = function() {
  return /** @type {number} */ (this.resolution);
};


/**
 * @return {module:ol/ImageState} State.
 */
ImageBase.prototype.getState = function() {
  return this.state;
};


/**
 * Load not yet loaded URI.
 * @abstract
 */
ImageBase.prototype.load = function() {};

export default ImageBase;
