goog.provide('ol.ImageBase');
goog.provide('ol.ImageState');

goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('ol.Attribution');
goog.require('ol.Extent');


/**
 * @enum {number}
 */
ol.ImageState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.ImageState} state State.
 * @param {Array.<ol.Attribution>} attributions Attributions.
 */
ol.ImageBase = function(extent, resolution, pixelRatio, state, attributions) {

  goog.base(this);

  /**
   * @private
   * @type {Array.<ol.Attribution>}
   */
  this.attributions_ = attributions;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = extent;

  /**
   * @private
   * @type {number}
   */
  this.pixelRatio_ = pixelRatio;

  /**
   * @private
   * @type {number}
   */
  this.resolution_ = resolution;

  /**
   * @protected
   * @type {ol.ImageState}
   */
  this.state = state;

};
goog.inherits(ol.ImageBase, goog.events.EventTarget);


/**
 * @protected
 */
ol.ImageBase.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @return {Array.<ol.Attribution>} Attributions.
 */
ol.ImageBase.prototype.getAttributions = function() {
  return this.attributions_;
};


/**
 * @return {ol.Extent} Extent.
 */
ol.ImageBase.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @param {Object=} opt_context Object.
 * @return {HTMLCanvasElement|Image|HTMLVideoElement} Image.
 */
ol.ImageBase.prototype.getImageElement = goog.abstractMethod;


/**
 * @return {number} PixelRatio.
 */
ol.ImageBase.prototype.getPixelRatio = function() {
  return this.pixelRatio_;
};


/**
 * @return {number} Resolution.
 */
ol.ImageBase.prototype.getResolution = function() {
  return this.resolution_;
};


/**
 * @return {ol.ImageState} State.
 */
ol.ImageBase.prototype.getState = function() {
  return this.state;
};


/**
 * Load not yet loaded URI.
 */
ol.ImageBase.prototype.load = goog.abstractMethod;
