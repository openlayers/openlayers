/**
 * @module ol/style/Image
 */


/**
 * @typedef {Object} Options
 * @property {number} opacity
 * @property {boolean} rotateWithView
 * @property {number} rotation
 * @property {number} scale
 * @property {boolean} snapToPixel
 */


/**
 * @classdesc
 * A base class used for creating subclasses and not instantiated in
 * apps. Base class for {@link module:ol/style/Icon~Icon}, {@link module:ol/style/Circle~CircleStyle} and
 * {@link module:ol/style/RegularShape~RegularShape}.
 *
 * @constructor
 * @abstract
 * @param {module:ol/style/Image~Options} options Options.
 * @api
 */
const ImageStyle = function(options) {

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
 * Get the symbolizer opacity.
 * @return {number} Opacity.
 * @api
 */
ImageStyle.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Determine whether the symbolizer rotates with the map.
 * @return {boolean} Rotate with map.
 * @api
 */
ImageStyle.prototype.getRotateWithView = function() {
  return this.rotateWithView_;
};


/**
 * Get the symoblizer rotation.
 * @return {number} Rotation.
 * @api
 */
ImageStyle.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * Get the symbolizer scale.
 * @return {number} Scale.
 * @api
 */
ImageStyle.prototype.getScale = function() {
  return this.scale_;
};


/**
 * Determine whether the symbolizer should be snapped to a pixel.
 * @return {boolean} The symbolizer should snap to a pixel.
 * @api
 */
ImageStyle.prototype.getSnapToPixel = function() {
  return this.snapToPixel_;
};


/**
 * Get the anchor point in pixels. The anchor determines the center point for the
 * symbolizer.
 * @abstract
 * @return {Array.<number>} Anchor.
 */
ImageStyle.prototype.getAnchor = function() {};


/**
 * Get the image element for the symbolizer.
 * @abstract
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
ImageStyle.prototype.getImage = function(pixelRatio) {};


/**
 * @abstract
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
ImageStyle.prototype.getHitDetectionImage = function(pixelRatio) {};


/**
 * @abstract
 * @return {module:ol/ImageState} Image state.
 */
ImageStyle.prototype.getImageState = function() {};


/**
 * @abstract
 * @return {module:ol/size~Size} Image size.
 */
ImageStyle.prototype.getImageSize = function() {};


/**
 * @abstract
 * @return {module:ol/size~Size} Size of the hit-detection image.
 */
ImageStyle.prototype.getHitDetectionImageSize = function() {};


/**
 * Get the origin of the symbolizer.
 * @abstract
 * @return {Array.<number>} Origin.
 */
ImageStyle.prototype.getOrigin = function() {};


/**
 * Get the size of the symbolizer (in pixels).
 * @abstract
 * @return {module:ol/size~Size} Size.
 */
ImageStyle.prototype.getSize = function() {};


/**
 * Set the opacity.
 *
 * @param {number} opacity Opacity.
 * @api
 */
ImageStyle.prototype.setOpacity = function(opacity) {
  this.opacity_ = opacity;
};


/**
 * Set whether to rotate the style with the view.
 *
 * @param {boolean} rotateWithView Rotate with map.
 * @api
 */
ImageStyle.prototype.setRotateWithView = function(rotateWithView) {
  this.rotateWithView_ = rotateWithView;
};


/**
 * Set the rotation.
 *
 * @param {number} rotation Rotation.
 * @api
 */
ImageStyle.prototype.setRotation = function(rotation) {
  this.rotation_ = rotation;
};


/**
 * Set the scale.
 *
 * @param {number} scale Scale.
 * @api
 */
ImageStyle.prototype.setScale = function(scale) {
  this.scale_ = scale;
};


/**
 * Set whether to snap the image to the closest pixel.
 *
 * @param {boolean} snapToPixel Snap to pixel?
 * @api
 */
ImageStyle.prototype.setSnapToPixel = function(snapToPixel) {
  this.snapToPixel_ = snapToPixel;
};


/**
 * @abstract
 * @param {function(this: T, module:ol/events/Event)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @return {module:ol/events~EventsKey|undefined} Listener key.
 * @template T
 */
ImageStyle.prototype.listenImageChange = function(listener, thisArg) {};


/**
 * Load not yet loaded URI.
 * @abstract
 */
ImageStyle.prototype.load = function() {};


/**
 * @abstract
 * @param {function(this: T, module:ol/events/Event)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @template T
 */
ImageStyle.prototype.unlistenImageChange = function(listener, thisArg) {};
export default ImageStyle;
