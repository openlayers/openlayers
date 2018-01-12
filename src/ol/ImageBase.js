/**
 * @module ol/ImageBase
 */
import {inherits} from './index.js';
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
const _ol_ImageBase_ = function(extent, resolution, pixelRatio, state) {

  EventTarget.call(this);

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

};

inherits(_ol_ImageBase_, EventTarget);


/**
 * @protected
 */
_ol_ImageBase_.prototype.changed = function() {
  this.dispatchEvent(EventType.CHANGE);
};


/**
 * @return {ol.Extent} Extent.
 */
_ol_ImageBase_.prototype.getExtent = function() {
  return this.extent;
};


/**
 * @abstract
 * @return {HTMLCanvasElement|Image|HTMLVideoElement} Image.
 */
_ol_ImageBase_.prototype.getImage = function() {};


/**
 * @return {number} PixelRatio.
 */
_ol_ImageBase_.prototype.getPixelRatio = function() {
  return this.pixelRatio_;
};


/**
 * @return {number} Resolution.
 */
_ol_ImageBase_.prototype.getResolution = function() {
  return /** @type {number} */ (this.resolution);
};


/**
 * @return {ol.ImageState} State.
 */
_ol_ImageBase_.prototype.getState = function() {
  return this.state;
};


/**
 * Load not yet loaded URI.
 * @abstract
 */
_ol_ImageBase_.prototype.load = function() {};
export default _ol_ImageBase_;
