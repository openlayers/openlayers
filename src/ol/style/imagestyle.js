goog.provide('ol.style.Image');
goog.provide('ol.style.ImageState');

goog.require('goog.array');


/**
 * @enum {number}
 */
ol.style.ImageState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
};


/**
 * @typedef {{rotation: number,
 *            scale: number,
 *            snapToPixel: (boolean|undefined),
 *            subtractViewRotation: boolean}}
 */
ol.style.ImageOptions;



/**
 * @constructor
 * @param {ol.style.ImageOptions} options Options.
 */
ol.style.Image = function(options) {

  /**
   * @private
   * @type {number}
   */
  this.rotation_ = options.rotation;

  /**
   * @private
   * @type {number}
   */
  this.scale_ = options.scale;

  /**
   * @private
   * @type {boolean|undefined}
   */
  this.snapToPixel_ = options.snapToPixel;

  /**
   * @private
   * @type {boolean|undefined}
   */
  this.subtractViewRotation_ = options.subtractViewRotation;

};


/**
 * @return {number} Rotation.
 */
ol.style.Image.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * @return {number} Scale.
 */
ol.style.Image.prototype.getScale = function() {
  return this.scale_;
};


/**
 * @return {boolean|undefined} Snap to pixel?
 */
ol.style.Image.prototype.getSnapToPixel = function() {
  return this.snapToPixel_;
};


/**
 * @return {boolean|undefined} Subtract view rotation?
 */
ol.style.Image.prototype.getSubtractViewRotation = function() {
  return this.subtractViewRotation_;
};


/**
 * @return {Array.<number>} Anchor.
 */
ol.style.Image.prototype.getAnchor = goog.abstractMethod;


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
ol.style.Image.prototype.getImage = goog.abstractMethod;


/**
 * @return {ol.style.ImageState} Image state.
 */
ol.style.Image.prototype.getImageState = goog.abstractMethod;


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
ol.style.Image.prototype.getHitDetectionImage = goog.abstractMethod;


/**
 * @return {ol.Size} Size.
 */
ol.style.Image.prototype.getSize = goog.abstractMethod;


/**
 * @param {function(this: T, goog.events.Event)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @return {goog.events.Key|undefined} Listener key.
 * @template T
 */
ol.style.Image.prototype.listenImageChange = goog.abstractMethod;


/**
 * Load not yet loaded URI.
 */
ol.style.Image.prototype.load = goog.abstractMethod;


/**
 * @param {function(this: T, goog.events.Event)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @template T
 */
ol.style.Image.prototype.unlistenImageChange = goog.abstractMethod;
