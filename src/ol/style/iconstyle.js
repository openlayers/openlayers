// FIXME decide default value for snapToPixel

goog.provide('ol.style.Icon');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');



/**
 * @constructor
 * @param {olx.style.IconOptions=} opt_options Options.
 * @extends {ol.style.Image}
 */
ol.style.Icon = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {Image}
   */
  this.image_ = new Image();

  /**
   * @type {?string}
   */
  var crossOrigin =
      goog.isDef(options.crossOrigin) ? options.crossOrigin : null;
  if (!goog.isNull(crossOrigin)) {
    this.image_.crossOrigin = crossOrigin;
  }

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

  /**
   * @type {ol.Size}
   */
  var size = goog.isDef(options.size) ? options.size : null;

  /**
   * @type {ol.Pixel}
   */
  var anchor;
  if (goog.isDef(options.anchor)) {
    anchor = options.anchor;
  } else if (!goog.isNull(size)) {
    anchor = [size[0] / 2, size[1] / 2];
  } else {
    anchor = null;
  }

  /**
   * @type {number}
   */
  var rotation = goog.isDef(options.rotation) ? options.rotation : 0;

  goog.base(this, {
    anchor: anchor,
    imageState: ol.style.ImageState.IDLE,
    rotation: rotation,
    size: size,
    snapToPixel: undefined,
    subtractViewRotation: false
  });

};
goog.inherits(ol.style.Icon, ol.style.Image);


/**
 * @private
 */
ol.style.Icon.prototype.handleImageError_ = function() {
  this.imageState = ol.style.ImageState.ERROR;
  this.unlistenImage_();
  this.dispatchChangeEvent();
};


/**
 * @private
 */
ol.style.Icon.prototype.handleImageLoad_ = function() {
  this.imageState = ol.style.ImageState.LOADED;
  if (goog.isNull(this.size)) {
    this.size = [this.image_.width, this.image_.height];
  }
  if (goog.isNull(this.anchor)) {
    this.anchor = [this.size[0] / 2, this.size[1] / 2];
  }
  this.unlistenImage_();
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.style.Icon.prototype.getImage = function(pixelRatio) {
  return this.image_;
};


/**
 * Load not yet loaded URI.
 */
ol.style.Icon.prototype.load = function() {
  if (this.imageState == ol.style.ImageState.IDLE) {
    goog.asserts.assert(goog.isDef(this.src_));
    goog.asserts.assert(goog.isNull(this.imageListenerKeys_));
    this.imageState = ol.style.ImageState.LOADING;
    this.imageListenerKeys_ = [
      goog.events.listenOnce(this.image_, goog.events.EventType.ERROR,
          this.handleImageError_, false, this),
      goog.events.listenOnce(this.image_, goog.events.EventType.LOAD,
          this.handleImageLoad_, false, this)
    ];
    this.image_.src = this.src_;
  }
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
ol.style.Icon.prototype.unlistenImage_ = function() {
  goog.asserts.assert(!goog.isNull(this.imageListenerKeys_));
  goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};
