goog.provide('ol.style.Image');
goog.provide('ol.style.ImageState');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


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
 * @typedef {{anchor: ol.Pixel,
 *            imageState: ol.style.ImageState,
 *            rotation: number,
 *            scale: number,
 *            size: ol.Size,
 *            snapToPixel: (boolean|undefined),
 *            subtractViewRotation: boolean}}
 */
ol.style.ImageOptions;



/**
 * @constructor
 * @param {ol.style.ImageOptions} options Options.
 * @extends {goog.events.EventTarget}
 */
ol.style.Image = function(options) {

  goog.base(this);

  /**
   * @protected
   * @type {ol.Pixel}
   */
  this.anchor = options.anchor;

  /**
   * @protected
   * @type {ol.style.ImageState}
   */
  this.imageState = options.imageState;

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
   * @protected
   * @type {ol.Size}
   */
  this.size = options.size;

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
goog.inherits(ol.style.Image, goog.events.EventTarget);


/**
 * @protected
 */
ol.style.Image.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @return {ol.Pixel} Anchor.
 */
ol.style.Image.prototype.getAnchor = function() {
  return this.anchor;
};


/**
 * @return {ol.style.ImageState} Image state.
 */
ol.style.Image.prototype.getImageState = function() {
  return this.imageState;
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
 * @return {ol.Size} Size.
 */
ol.style.Image.prototype.getSize = function() {
  return this.size;
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
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
ol.style.Image.prototype.getImage = goog.abstractMethod;


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
ol.style.Image.prototype.getHitDetectionImage = goog.abstractMethod;


/**
 * Load not yet loaded URI.
 */
ol.style.Image.prototype.load = goog.abstractMethod;
