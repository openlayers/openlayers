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
   * @type {ol.Pixel}
   */
  this.anchor = options.anchor;

  /**
   * @type {ol.style.ImageState}
   */
  this.imageState = options.imageState;

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
goog.inherits(ol.style.Image, goog.events.EventTarget);


/**
 * @protected
 */
ol.style.Image.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Image element.
 */
ol.style.Image.prototype.getImage = goog.abstractMethod;


/**
 * Load not yet loaded URI.
 */
ol.style.Image.prototype.load = goog.abstractMethod;
