goog.provide('ol.style.Image');
goog.provide('ol.style.ImageState');


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
 * @typedef {{opacity: number,
 *            rotateWithView: boolean,
 *            rotation: number,
 *            scale: number,
 *            snapToPixel: boolean}}
 */
ol.style.ImageOptions;



/**
 * @classdesc
 * Set image style for vector features.
 *
 * @constructor
 * @param {ol.style.ImageOptions} options Options.
 */
ol.style.Image = function(options) {

  /**
   * @private
   * @type {number}
   */
  this.opacity_ = options.opacity;

  /**
   * @private
   * @type {boolean}
   */
  this.rotateWithView_ = options.rotateWithView;

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
   * @type {boolean}
   */
  this.snapToPixel_ = options.snapToPixel;

};


/**
 * @return {number} Opacity.
 */
ol.style.Image.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * @return {boolean} Rotate with map.
 */
ol.style.Image.prototype.getRotateWithView = function() {
  return this.rotateWithView_;
};


/**
 * @return {number} Rotation.
 * @api
 */
ol.style.Image.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * @return {number} Scale.
 * @api
 */
ol.style.Image.prototype.getScale = function() {
  return this.scale_;
};


/**
 * @return {boolean} Snap to pixel?
 */
ol.style.Image.prototype.getSnapToPixel = function() {
  return this.snapToPixel_;
};


/**
 * @function
 * @return {Array.<number>} Anchor.
 */
ol.style.Image.prototype.getAnchor = goog.abstractMethod;


/**
 * @function
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
 * @function
 * @return {Array.<number>} Origin.
 */
ol.style.Image.prototype.getOrigin = goog.abstractMethod;


/**
 * @function
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
