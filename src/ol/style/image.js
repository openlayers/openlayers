/**
 * @classdesc
 * A base class used for creating subclasses and not instantiated in
 * apps. Base class for {@link ol.style.Icon}, {@link ol.style.Circle} and
 * {@link ol.style.RegularShape}.
 *
 * @constructor
 * @abstract
 * @param {ol.StyleImageOptions} options Options.
 * @api
 */
var _ol_style_Image_ = function(options) {

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
_ol_style_Image_.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Determine whether the symbolizer rotates with the map.
 * @return {boolean} Rotate with map.
 * @api
 */
_ol_style_Image_.prototype.getRotateWithView = function() {
  return this.rotateWithView_;
};


/**
 * Get the symoblizer rotation.
 * @return {number} Rotation.
 * @api
 */
_ol_style_Image_.prototype.getRotation = function() {
  return this.rotation_;
};


/**
 * Get the symbolizer scale.
 * @return {number} Scale.
 * @api
 */
_ol_style_Image_.prototype.getScale = function() {
  return this.scale_;
};


/**
 * Determine whether the symbolizer should be snapped to a pixel.
 * @return {boolean} The symbolizer should snap to a pixel.
 * @api
 */
_ol_style_Image_.prototype.getSnapToPixel = function() {
  return this.snapToPixel_;
};


/**
 * Get the anchor point in pixels. The anchor determines the center point for the
 * symbolizer.
 * @abstract
 * @return {Array.<number>} Anchor.
 */
_ol_style_Image_.prototype.getAnchor = function() {};


/**
 * Get the image element for the symbolizer.
 * @abstract
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
_ol_style_Image_.prototype.getImage = function(pixelRatio) {};


/**
 * @abstract
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
_ol_style_Image_.prototype.getHitDetectionImage = function(pixelRatio) {};


/**
 * @abstract
 * @return {ol.ImageState} Image state.
 */
_ol_style_Image_.prototype.getImageState = function() {};


/**
 * @abstract
 * @return {ol.Size} Image size.
 */
_ol_style_Image_.prototype.getImageSize = function() {};


/**
 * @abstract
 * @return {ol.Size} Size of the hit-detection image.
 */
_ol_style_Image_.prototype.getHitDetectionImageSize = function() {};


/**
 * Get the origin of the symbolizer.
 * @abstract
 * @return {Array.<number>} Origin.
 */
_ol_style_Image_.prototype.getOrigin = function() {};


/**
 * Get the size of the symbolizer (in pixels).
 * @abstract
 * @return {ol.Size} Size.
 */
_ol_style_Image_.prototype.getSize = function() {};


/**
 * Set the opacity.
 *
 * @param {number} opacity Opacity.
 * @api
 */
_ol_style_Image_.prototype.setOpacity = function(opacity) {
  this.opacity_ = opacity;
};


/**
 * Set whether to rotate the style with the view.
 *
 * @param {boolean} rotateWithView Rotate with map.
 */
_ol_style_Image_.prototype.setRotateWithView = function(rotateWithView) {
  this.rotateWithView_ = rotateWithView;
};


/**
 * Set the rotation.
 *
 * @param {number} rotation Rotation.
 * @api
 */
_ol_style_Image_.prototype.setRotation = function(rotation) {
  this.rotation_ = rotation;
};


/**
 * Set the scale.
 *
 * @param {number} scale Scale.
 * @api
 */
_ol_style_Image_.prototype.setScale = function(scale) {
  this.scale_ = scale;
};


/**
 * Set whether to snap the image to the closest pixel.
 *
 * @param {boolean} snapToPixel Snap to pixel?
 */
_ol_style_Image_.prototype.setSnapToPixel = function(snapToPixel) {
  this.snapToPixel_ = snapToPixel;
};


/**
 * @abstract
 * @param {function(this: T, ol.events.Event)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @return {ol.EventsKey|undefined} Listener key.
 * @template T
 */
_ol_style_Image_.prototype.listenImageChange = function(listener, thisArg) {};


/**
 * Load not yet loaded URI.
 * @abstract
 */
_ol_style_Image_.prototype.load = function() {};


/**
 * @abstract
 * @param {function(this: T, ol.events.Event)} listener Listener function.
 * @param {T} thisArg Value to use as `this` when executing `listener`.
 * @template T
 */
_ol_style_Image_.prototype.unlistenImageChange = function(listener, thisArg) {};
export default _ol_style_Image_;
