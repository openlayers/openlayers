// FIXME decide default value for snapToPixel

goog.provide('ol.style.Icon');
goog.provide('ol.style.IconAnchorUnits');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');


/**
 * @enum {string}
 */
ol.style.IconAnchorUnits = {
  FRACTION: 'fraction',
  PIXELS: 'pixels'
};



/**
 * @constructor
 * @param {olx.style.IconOptions=} opt_options Options.
 * @extends {ol.style.Image}
 */
ol.style.Icon = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {Image|HTMLCanvasElement}
   */
  this.hitDetectionImage_ = null;

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
   * @private
   * @type {boolean}
   */
  this.tainting_ = false;

  /**
   * @type {ol.Size}
   */
  var size = goog.isDef(options.size) ? options.size : null;

  /**
   * @private
   * @type {ol.style.IconAnchorUnits}
   */
  this.anchorXUnits_ = goog.isDef(options.anchorXUnits) ?
      options.anchorXUnits : ol.style.IconAnchorUnits.FRACTION;

  /**
   * @private
   * @type {ol.style.IconAnchorUnits}
   */
  this.anchorYUnits_ = goog.isDef(options.anchorYUnits) ?
      options.anchorYUnits : ol.style.IconAnchorUnits.FRACTION;

  /**
   * @type {Array.<number>}
   */
  var anchor = goog.isDef(options.anchor) ? options.anchor : [0.5, 0.5];

  /**
   * @type {number}
   */
  var rotation = goog.isDef(options.rotation) ? options.rotation : 0;

  /**
   * @type {number}
   */
  var scale = goog.isDef(options.scale) ? options.scale : 1;

  goog.base(this, {
    anchor: anchor,
    imageState: ol.style.ImageState.IDLE,
    rotation: rotation,
    scale: scale,
    size: size,
    snapToPixel: undefined,
    subtractViewRotation: false
  });

};
goog.inherits(ol.style.Icon, ol.style.Image);


/**
 * @private
 */
ol.style.Icon.prototype.determineTainting_ = function() {
  var canvas = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  canvas.width = 1;
  canvas.height = 1;
  var context = /** @type {CanvasRenderingContext2D} */
      (canvas.getContext('2d'));
  context.drawImage(this.image_, 0, 0);
  try {
    context.getImageData(0, 0, 1, 1);
  } catch (e) {
    this.tainting_ = true;
  }
};


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
  if (this.anchorXUnits_ == ol.style.IconAnchorUnits.FRACTION) {
    this.anchor[0] = this.size[0] * this.anchor[0];
  }
  if (this.anchorYUnits_ == ol.style.IconAnchorUnits.FRACTION) {
    this.anchor[1] = this.size[1] * this.anchor[1];
  }
  this.unlistenImage_();
  this.determineTainting_();
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.style.Icon.prototype.getImage = function(pixelRatio) {
  return this.image_;
};


/**
 * @inheritDoc
 */
ol.style.Icon.prototype.getHitDetectionImage = function(pixelRatio) {
  if (goog.isNull(this.hitDetectionImage_)) {
    if (this.tainting_) {
      var canvas = /** @type {HTMLCanvasElement} */
          (goog.dom.createElement(goog.dom.TagName.CANVAS));
      var width = this.size[0];
      var height = this.size[1];
      canvas.width = width;
      canvas.height = height;
      var context = /** @type {CanvasRenderingContext2D} */
          (canvas.getContext('2d'));
      context.fillRect(0, 0, width, height);
      this.hitDetectionImage_ = canvas;
    } else {
      this.hitDetectionImage_ = this.image_;
    }
  }
  return this.hitDetectionImage_;
};


/**
 * @return {string|undefined} Image src.
 */
ol.style.Icon.prototype.getSrc = function() {
  return this.src_;
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
