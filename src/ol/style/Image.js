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
class ImageStyle {
  constructor(options) {

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

  }

  /**
  * Get the symbolizer opacity.
  * @return {number} Opacity.
  * @api
  */
  getOpacity() {
    return this.opacity_;
  }

  /**
  * Determine whether the symbolizer rotates with the map.
  * @return {boolean} Rotate with map.
  * @api
  */
  getRotateWithView() {
    return this.rotateWithView_;
  }

  /**
  * Get the symoblizer rotation.
  * @return {number} Rotation.
  * @api
  */
  getRotation() {
    return this.rotation_;
  }

  /**
  * Get the symbolizer scale.
  * @return {number} Scale.
  * @api
  */
  getScale() {
    return this.scale_;
  }

  /**
  * Determine whether the symbolizer should be snapped to a pixel.
  * @return {boolean} The symbolizer should snap to a pixel.
  * @api
  */
  getSnapToPixel() {
    return this.snapToPixel_;
  }

  /**
  * Get the anchor point in pixels. The anchor determines the center point for the
  * symbolizer.
  * @abstract
  * @return {Array.<number>} Anchor.
  */
  getAnchor() {}

  /**
  * Get the image element for the symbolizer.
  * @abstract
  * @param {number} pixelRatio Pixel ratio.
  * @return {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} Image element.
  */
  getImage(pixelRatio) {}

  /**
  * @abstract
  * @param {number} pixelRatio Pixel ratio.
  * @return {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} Image element.
  */
  getHitDetectionImage(pixelRatio) {}

  /**
  * @abstract
  * @return {module:ol/ImageState} Image state.
  */
  getImageState() {}

  /**
  * @abstract
  * @return {module:ol/size~Size} Image size.
  */
  getImageSize() {}

  /**
  * @abstract
  * @return {module:ol/size~Size} Size of the hit-detection image.
  */
  getHitDetectionImageSize() {}

  /**
  * Get the origin of the symbolizer.
  * @abstract
  * @return {Array.<number>} Origin.
  */
  getOrigin() {}

  /**
  * Get the size of the symbolizer (in pixels).
  * @abstract
  * @return {module:ol/size~Size} Size.
  */
  getSize() {}

  /**
  * Set the opacity.
  *
  * @param {number} opacity Opacity.
  * @api
  */
  setOpacity(opacity) {
    this.opacity_ = opacity;
  }

  /**
  * Set whether to rotate the style with the view.
  *
  * @param {boolean} rotateWithView Rotate with map.
  * @api
  */
  setRotateWithView(rotateWithView) {
    this.rotateWithView_ = rotateWithView;
  }

  /**
  * Set the rotation.
  *
  * @param {number} rotation Rotation.
  * @api
  */
  setRotation(rotation) {
    this.rotation_ = rotation;
  }

  /**
  * Set the scale.
  *
  * @param {number} scale Scale.
  * @api
  */
  setScale(scale) {
    this.scale_ = scale;
  }

  /**
  * Set whether to snap the image to the closest pixel.
  *
  * @param {boolean} snapToPixel Snap to pixel?
  * @api
  */
  setSnapToPixel(snapToPixel) {
    this.snapToPixel_ = snapToPixel;
  }

  /**
  * @abstract
  * @param {function(this: T, module:ol/events/Event)} listener Listener function.
  * @param {T} thisArg Value to use as `this` when executing `listener`.
  * @return {module:ol/events~EventsKey|undefined} Listener key.
  * @template T
  */
  listenImageChange(listener, thisArg) {}

  /**
  * Load not yet loaded URI.
  * @abstract
  */
  load() {}

  /**
  * @abstract
  * @param {function(this: T, module:ol/events/Event)} listener Listener function.
  * @param {T} thisArg Value to use as `this` when executing `listener`.
  * @template T
  */
  unlistenImageChange(listener, thisArg) {}
}

export default ImageStyle;
