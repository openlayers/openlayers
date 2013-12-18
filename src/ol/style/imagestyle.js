// FIXME decide default value for snapToPixel

goog.provide('ol.style.Image');
goog.provide('ol.style.ImageState');

goog.require('goog.array');
goog.require('goog.asserts');
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
 * @constructor
 * @param {olx.style.ImageOptions=} opt_options Options.
 * @extends {goog.events.EventTarget}
 */
ol.style.Image = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this);

  /**
   * @type {ol.Pixel}
   */
  this.anchor = options.anchor;

  /**
   * @type {HTMLCanvasElement|HTMLVideoElement|Image}
   */
  this.image = goog.isDefAndNotNull(options.image) ?
      options.image : new Image();
  if (!goog.isNull(options.crossOrigin)) {
    this.image.crossOrigin = options.crossOrigin;
  }

  /**
   * @type {ol.style.ImageState}
   */
  this.imageState = goog.isDef(options.imageState) ?
      options.imageState : ol.style.ImageState.IDLE;

  /**
   * @type {number|undefined}
   */
  this.rotation = options.rotation;

  /**
   * @type {number|undefined}
   */
  this.scale = options.scale;

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

  /**
   * @private
   * @type {Array.<number>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.src_ = options.src;

};
goog.inherits(ol.style.Image, goog.events.EventTarget);


/**
 * @private
 */
ol.style.Image.prototype.dispatchChangeEvent_ = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * Tracks loading or read errors.
 *
 * @private
 */
ol.style.Image.prototype.handleImageError_ = function() {
  this.imageState = ol.style.ImageState.ERROR;
  this.unlistenImage_();
  this.dispatchChangeEvent_();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
ol.style.Image.prototype.handleImageLoad_ = function() {
  this.imageState = ol.style.ImageState.LOADED;
  if (goog.isNull(this.size)) {
    this.size = [this.image.width, this.image.height];
  }
  if (goog.isNull(this.anchor)) {
    this.anchor = [this.size[0] / 2, this.size[1] / 2];
  }
  this.unlistenImage_();
  this.dispatchChangeEvent_();
};


/**
 * Load not yet loaded URI.
 */
ol.style.Image.prototype.load = function() {
  if (this.imageState == ol.style.ImageState.IDLE) {
    goog.asserts.assert(goog.isDef(this.src_));
    goog.asserts.assert(goog.isNull(this.imageListenerKeys_));
    this.imageState = ol.style.ImageState.LOADING;
    this.imageListenerKeys_ = [
      goog.events.listenOnce(this.image, goog.events.EventType.ERROR,
          this.handleImageError_, false, this),
      goog.events.listenOnce(this.image, goog.events.EventType.LOAD,
          this.handleImageLoad_, false, this)
    ];
    this.image.src = this.src_;
  }
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
ol.style.Image.prototype.unlistenImage_ = function() {
  goog.asserts.assert(!goog.isNull(this.imageListenerKeys_));
  goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};
