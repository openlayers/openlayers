goog.provide('ol.style.Icon');
goog.provide('ol.style.IconAnchorUnits');
goog.provide('ol.style.IconImageCache');
goog.provide('ol.style.IconOrigin');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('ol.dom');
goog.require('ol.style.Image');
goog.require('ol.style.ImageState');


/**
 * Icon anchor units. One of 'fraction', 'pixels'.
 * @enum {string}
 * @api
 */
ol.style.IconAnchorUnits = {
  FRACTION: 'fraction',
  PIXELS: 'pixels'
};


/**
 * Icon origin. One of 'bottom-left', 'bottom-right', 'top-left', 'top-right'.
 * @enum {string}
 * @api
 */
ol.style.IconOrigin = {
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right'
};



/**
 * @classdesc
 * Set icon style for vector features.
 *
 * @constructor
 * @param {olx.style.IconOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @api
 */
ol.style.Icon = function(opt_options) {

  var options = opt_options || {};

  /**
   * @private
   * @type {Array.<number>}
   */
  this.anchor_ = options.anchor !== undefined ? options.anchor : [0.5, 0.5];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.normalizedAnchor_ = null;

  /**
   * @private
   * @type {ol.style.IconOrigin}
   */
  this.anchorOrigin_ = options.anchorOrigin !== undefined ?
      options.anchorOrigin : ol.style.IconOrigin.TOP_LEFT;

  /**
   * @private
   * @type {ol.style.IconAnchorUnits}
   */
  this.anchorXUnits_ = options.anchorXUnits !== undefined ?
      options.anchorXUnits : ol.style.IconAnchorUnits.FRACTION;

  /**
   * @private
   * @type {ol.style.IconAnchorUnits}
   */
  this.anchorYUnits_ = options.anchorYUnits !== undefined ?
      options.anchorYUnits : ol.style.IconAnchorUnits.FRACTION;

  /**
   * @type {?string}
   */
  var crossOrigin =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

  /**
   * @type {Image}
   */
  var image = options.img !== undefined ? options.img : null;

  /**
   * @type {ol.Size}
   */
  var imgSize = options.imgSize !== undefined ? options.imgSize : null;

  /**
   * @type {string|undefined}
   */
  var src = options.src;

  goog.asserts.assert(!(src !== undefined && image),
      'image and src can not provided at the same time');
  goog.asserts.assert(
      src === undefined || (src !== undefined && !imgSize),
      'imgSize should not be set when src is provided');
  goog.asserts.assert(
      !image || (image && imgSize),
      'imgSize must be set when image is provided');

  if ((src === undefined || src.length === 0) && image) {
    src = image.src;
  }
  goog.asserts.assert(src !== undefined && src.length > 0,
      'must provide a defined and non-empty src or image');

  /**
   * @type {ol.style.ImageState}
   */
  var imageState = options.src !== undefined ?
      ol.style.ImageState.IDLE : ol.style.ImageState.LOADED;

  /**
   * @private
   * @type {ol.style.IconImage_}
   */
  this.iconImage_ = ol.style.IconImage_.get(
      image, src, imgSize, crossOrigin, imageState);

  /**
   * @private
   * @type {Array.<number>}
   */
  this.offset_ = options.offset !== undefined ? options.offset : [0, 0];

  /**
   * @private
   * @type {ol.style.IconOrigin}
   */
  this.offsetOrigin_ = options.offsetOrigin !== undefined ?
      options.offsetOrigin : ol.style.IconOrigin.TOP_LEFT;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.origin_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.size_ = options.size !== undefined ? options.size : null;

  /**
   * @type {number}
   */
  var opacity = options.opacity !== undefined ? options.opacity : 1;

  /**
   * @type {boolean}
   */
  var rotateWithView = options.rotateWithView !== undefined ?
      options.rotateWithView : false;

  /**
   * @type {number}
   */
  var rotation = options.rotation !== undefined ? options.rotation : 0;

  /**
   * @type {number}
   */
  var scale = options.scale !== undefined ? options.scale : 1;

  /**
   * @type {boolean}
   */
  var snapToPixel = options.snapToPixel !== undefined ?
      options.snapToPixel : true;

  goog.base(this, {
    opacity: opacity,
    rotation: rotation,
    scale: scale,
    snapToPixel: snapToPixel,
    rotateWithView: rotateWithView
  });

};
goog.inherits(ol.style.Icon, ol.style.Image);


/**
 * @inheritDoc
 * @api
 */
ol.style.Icon.prototype.getAnchor = function() {
  if (this.normalizedAnchor_) {
    return this.normalizedAnchor_;
  }
  var anchor = this.anchor_;
  var size = this.getSize();
  if (this.anchorXUnits_ == ol.style.IconAnchorUnits.FRACTION ||
      this.anchorYUnits_ == ol.style.IconAnchorUnits.FRACTION) {
    if (!size) {
      return null;
    }
    anchor = this.anchor_.slice();
    if (this.anchorXUnits_ == ol.style.IconAnchorUnits.FRACTION) {
      anchor[0] *= size[0];
    }
    if (this.anchorYUnits_ == ol.style.IconAnchorUnits.FRACTION) {
      anchor[1] *= size[1];
    }
  }

  if (this.anchorOrigin_ != ol.style.IconOrigin.TOP_LEFT) {
    if (!size) {
      return null;
    }
    if (anchor === this.anchor_) {
      anchor = this.anchor_.slice();
    }
    if (this.anchorOrigin_ == ol.style.IconOrigin.TOP_RIGHT ||
        this.anchorOrigin_ == ol.style.IconOrigin.BOTTOM_RIGHT) {
      anchor[0] = -anchor[0] + size[0];
    }
    if (this.anchorOrigin_ == ol.style.IconOrigin.BOTTOM_LEFT ||
        this.anchorOrigin_ == ol.style.IconOrigin.BOTTOM_RIGHT) {
      anchor[1] = -anchor[1] + size[1];
    }
  }
  this.normalizedAnchor_ = anchor;
  return this.normalizedAnchor_;
};


/**
 * Get the image icon.
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image} Image element.
 * @api
 */
ol.style.Icon.prototype.getImage = function(pixelRatio) {
  return this.iconImage_.getImage(pixelRatio);
};


/**
 * Real Image size used.
 * @return {ol.Size} Size.
 */
ol.style.Icon.prototype.getImageSize = function() {
  return this.iconImage_.getSize();
};


/**
 * @inheritDoc
 */
ol.style.Icon.prototype.getHitDetectionImageSize = function() {
  return this.getImageSize();
};


/**
 * @inheritDoc
 */
ol.style.Icon.prototype.getImageState = function() {
  return this.iconImage_.getImageState();
};


/**
 * @inheritDoc
 */
ol.style.Icon.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.iconImage_.getHitDetectionImage(pixelRatio);
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Icon.prototype.getOrigin = function() {
  if (this.origin_) {
    return this.origin_;
  }
  var offset = this.offset_;

  if (this.offsetOrigin_ != ol.style.IconOrigin.TOP_LEFT) {
    var size = this.getSize();
    var iconImageSize = this.iconImage_.getSize();
    if (!size || !iconImageSize) {
      return null;
    }
    offset = offset.slice();
    if (this.offsetOrigin_ == ol.style.IconOrigin.TOP_RIGHT ||
        this.offsetOrigin_ == ol.style.IconOrigin.BOTTOM_RIGHT) {
      offset[0] = iconImageSize[0] - size[0] - offset[0];
    }
    if (this.offsetOrigin_ == ol.style.IconOrigin.BOTTOM_LEFT ||
        this.offsetOrigin_ == ol.style.IconOrigin.BOTTOM_RIGHT) {
      offset[1] = iconImageSize[1] - size[1] - offset[1];
    }
  }
  this.origin_ = offset;
  return this.origin_;
};


/**
 * Get the image URL.
 * @return {string|undefined} Image src.
 * @api
 */
ol.style.Icon.prototype.getSrc = function() {
  return this.iconImage_.getSrc();
};


/**
 * @inheritDoc
 * @api
 */
ol.style.Icon.prototype.getSize = function() {
  return !this.size_ ? this.iconImage_.getSize() : this.size_;
};


/**
 * @inheritDoc
 */
ol.style.Icon.prototype.listenImageChange = function(listener, thisArg) {
  return goog.events.listen(this.iconImage_, goog.events.EventType.CHANGE,
      listener, false, thisArg);
};


/**
 * Load not yet loaded URI.
 * When rendering a feature with an icon style, the vector renderer will
 * automatically call this method. However, you might want to call this
 * method yourself for preloading or other purposes.
 * @api
 */
ol.style.Icon.prototype.load = function() {
  this.iconImage_.load();
};


/**
 * @inheritDoc
 */
ol.style.Icon.prototype.unlistenImageChange = function(listener, thisArg) {
  goog.events.unlisten(this.iconImage_, goog.events.EventType.CHANGE,
      listener, false, thisArg);
};



/**
 * @constructor
 * @param {Image} image Image.
 * @param {string|undefined} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.style.ImageState} imageState Image state.
 * @extends {goog.events.EventTarget}
 * @private
 */
ol.style.IconImage_ = function(image, src, size, crossOrigin, imageState) {

  goog.base(this);

  /**
   * @private
   * @type {Image|HTMLCanvasElement}
   */
  this.hitDetectionImage_ = null;

  /**
   * @private
   * @type {Image}
   */
  this.image_ = !image ? new Image() : image;

  if (crossOrigin) {
    this.image_.crossOrigin = crossOrigin;
  }

  /**
   * @private
   * @type {Array.<goog.events.Key>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @private
   * @type {ol.style.ImageState}
   */
  this.imageState_ = imageState;

  /**
   * @private
   * @type {ol.Size}
   */
  this.size_ = size;

  /**
   * @private
   * @type {string|undefined}
   */
  this.src_ = src;

  /**
   * @private
   * @type {boolean}
   */
  this.tainting_ = false;
  if (this.imageState_ == ol.style.ImageState.LOADED) {
    this.determineTainting_();
  }

};
goog.inherits(ol.style.IconImage_, goog.events.EventTarget);


/**
 * @param {Image} image Image.
 * @param {string} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.style.ImageState} imageState Image state.
 * @return {ol.style.IconImage_} Icon image.
 */
ol.style.IconImage_.get = function(image, src, size, crossOrigin, imageState) {
  var iconImageCache = ol.style.IconImageCache.getInstance();
  var iconImage = iconImageCache.get(src, crossOrigin);
  if (!iconImage) {
    iconImage = new ol.style.IconImage_(
        image, src, size, crossOrigin, imageState);
    iconImageCache.set(src, crossOrigin, iconImage);
  }
  return iconImage;
};


/**
 * @private
 */
ol.style.IconImage_.prototype.determineTainting_ = function() {
  var context = ol.dom.createCanvasContext2D(1, 1);
  try {
    context.drawImage(this.image_, 0, 0);
    context.getImageData(0, 0, 1, 1);
  } catch (e) {
    this.tainting_ = true;
  }
};


/**
 * @private
 */
ol.style.IconImage_.prototype.dispatchChangeEvent_ = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @private
 */
ol.style.IconImage_.prototype.handleImageError_ = function() {
  this.imageState_ = ol.style.ImageState.ERROR;
  this.unlistenImage_();
  this.dispatchChangeEvent_();
};


/**
 * @private
 */
ol.style.IconImage_.prototype.handleImageLoad_ = function() {
  this.imageState_ = ol.style.ImageState.LOADED;
  this.size_ = [this.image_.width, this.image_.height];
  this.unlistenImage_();
  this.determineTainting_();
  this.dispatchChangeEvent_();
};


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image} Image element.
 */
ol.style.IconImage_.prototype.getImage = function(pixelRatio) {
  return this.image_;
};


/**
 * @return {ol.style.ImageState} Image state.
 */
ol.style.IconImage_.prototype.getImageState = function() {
  return this.imageState_;
};


/**
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image|HTMLCanvasElement} Image element.
 */
ol.style.IconImage_.prototype.getHitDetectionImage = function(pixelRatio) {
  if (!this.hitDetectionImage_) {
    if (this.tainting_) {
      var width = this.size_[0];
      var height = this.size_[1];
      var context = ol.dom.createCanvasContext2D(width, height);
      context.fillRect(0, 0, width, height);
      this.hitDetectionImage_ = context.canvas;
    } else {
      this.hitDetectionImage_ = this.image_;
    }
  }
  return this.hitDetectionImage_;
};


/**
 * @return {ol.Size} Image size.
 */
ol.style.IconImage_.prototype.getSize = function() {
  return this.size_;
};


/**
 * @return {string|undefined} Image src.
 */
ol.style.IconImage_.prototype.getSrc = function() {
  return this.src_;
};


/**
 * Load not yet loaded URI.
 */
ol.style.IconImage_.prototype.load = function() {
  if (this.imageState_ == ol.style.ImageState.IDLE) {
    goog.asserts.assert(this.src_ !== undefined,
        'this.src_ must not be undefined');
    goog.asserts.assert(!this.imageListenerKeys_,
        'no listener keys existing');
    this.imageState_ = ol.style.ImageState.LOADING;
    this.imageListenerKeys_ = [
      goog.events.listenOnce(this.image_, goog.events.EventType.ERROR,
          this.handleImageError_, false, this),
      goog.events.listenOnce(this.image_, goog.events.EventType.LOAD,
          this.handleImageLoad_, false, this)
    ];
    try {
      this.image_.src = this.src_;
    } catch (e) {
      this.handleImageError_();
    }
  }
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
ol.style.IconImage_.prototype.unlistenImage_ = function() {
  goog.asserts.assert(this.imageListenerKeys_,
      'we must have listeners registered');
  this.imageListenerKeys_.forEach(goog.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};



/**
 * @constructor
 */
ol.style.IconImageCache = function() {

  /**
   * @type {Object.<string, ol.style.IconImage_>}
   * @private
   */
  this.cache_ = {};

  /**
   * @type {number}
   * @private
   */
  this.cacheSize_ = 0;

  /**
   * @const
   * @type {number}
   * @private
   */
  this.maxCacheSize_ = 32;
};
goog.addSingletonGetter(ol.style.IconImageCache);


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @return {string} Cache key.
 */
ol.style.IconImageCache.getKey = function(src, crossOrigin) {
  goog.asserts.assert(crossOrigin !== undefined,
      'argument crossOrigin must be defined');
  return crossOrigin + ':' + src;
};


/**
 * FIXME empty description for jsdoc
 */
ol.style.IconImageCache.prototype.clear = function() {
  this.cache_ = {};
  this.cacheSize_ = 0;
};


/**
 * FIXME empty description for jsdoc
 */
ol.style.IconImageCache.prototype.expire = function() {
  if (this.cacheSize_ > this.maxCacheSize_) {
    var i = 0;
    var key, iconImage;
    for (key in this.cache_) {
      iconImage = this.cache_[key];
      if ((i++ & 3) === 0 && !goog.events.hasListener(iconImage)) {
        delete this.cache_[key];
        --this.cacheSize_;
      }
    }
  }
};


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @return {ol.style.IconImage_} Icon image.
 */
ol.style.IconImageCache.prototype.get = function(src, crossOrigin) {
  var key = ol.style.IconImageCache.getKey(src, crossOrigin);
  return key in this.cache_ ? this.cache_[key] : null;
};


/**
 * @param {string} src Src.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.style.IconImage_} iconImage Icon image.
 */
ol.style.IconImageCache.prototype.set = function(src, crossOrigin, iconImage) {
  var key = ol.style.IconImageCache.getKey(src, crossOrigin);
  this.cache_[key] = iconImage;
  ++this.cacheSize_;
};
