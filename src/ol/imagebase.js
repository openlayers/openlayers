import _ol_ from './index';
import _ol_events_EventTarget_ from './events/eventtarget';
import _ol_events_EventType_ from './events/eventtype';

/**
 * @constructor
 * @abstract
 * @extends {ol.events.EventTarget}
 * @param {ol.Extent} extent Extent.
 * @param {number|undefined} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.ImageState} state State.
 * @param {Array.<ol.Attribution>} attributions Attributions.
 */
var _ol_ImageBase_ = function(extent, resolution, pixelRatio, state, attributions) {

  _ol_events_EventTarget_.call(this);

  /**
   * @private
   * @type {Array.<ol.Attribution>}
   */
  this.attributions_ = attributions;

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

_ol_.inherits(_ol_ImageBase_, _ol_events_EventTarget_);


/**
 * @protected
 */
_ol_ImageBase_.prototype.changed = function() {
  this.dispatchEvent(_ol_events_EventType_.CHANGE);
};


/**
 * @return {Array.<ol.Attribution>} Attributions.
 */
_ol_ImageBase_.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * @return {ol.Extent} Extent.
 */
_ol_ImageBase_.prototype.getExtent = function() {
  return this.extent;
};


/**
 * @abstract
 * @param {Object=} opt_context Object.
 * @return {HTMLCanvasElement|Image|HTMLVideoElement} Image.
 */
_ol_ImageBase_.prototype.getImage = function(opt_context) {};


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
