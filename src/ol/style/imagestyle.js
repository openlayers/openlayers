// FIXME export ol.style.Image
// FIXME decide default value for snapToPixel

goog.provide('ol.style.Image');


/**
 * @typedef {{anchor: Array.<number>,
 *            image: (HTMLCanvasElement|HTMLVideoElement|Image),
 *            rotation: number,
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
   * @type {Array.<number>}
   */
  this.anchor = options.anchor;

  /**
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.image = options.image;

  /**
   * @type {number}
   */
  this.rotation = options.rotation;

  /**
   * @type {boolean|undefined}
   */
  this.snapToPixel = options.snapToPixel;

  /**
   * @type {boolean}
   */
  this.subtractViewRotation = options.subtractViewRotation;

};
