// FIXME decide default value for snapToPixel

goog.provide('ol.style.Image');



/**
 * @constructor
 * @param {ol.style.ImageOptions} options Options.
 */
ol.style.Image = function(options) {

  /**
   * @type {ol.Pixel}
   */
  this.anchor = options.anchor;

  /**
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.image = options.image;

  /**
   * @type {number|undefined}
   */
  this.rotation = options.rotation;

  /**
   * @type {ol.Size}
   */
  this.size = options.size;

  /**
   * @type {boolean|undefined}
   */
  this.snapToPixel = options.snapToPixel;

  /**
   * @type {boolean|undefined}
   */
  this.subtractViewRotation = options.subtractViewRotation;

};
