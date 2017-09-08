goog.provide('ol.style.Icon');

goog.require('ol');
goog.require('ol.ImageState');
goog.require('ol.asserts');
goog.require('ol.color');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.style.IconAnchorUnits');
goog.require('ol.style.IconImage');
goog.require('ol.style.IconOrigin');
goog.require('ol.style.Image');


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
   * @private
   * @type {?string}
   */
  this.crossOrigin_ =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

  /**
   * @type {Image|HTMLCanvasElement}
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

  ol.asserts.assert(!(src !== undefined && image),
      4); // `image` and `src` cannot be provided at the same time
  ol.asserts.assert(!image || (image && imgSize),
      5); // `imgSize` must be set when `image` is provided

  if ((src === undefined || src.length === 0) && image) {
    src = image.src || ol.getUid(image).toString();
  }
  ol.asserts.assert(src !== undefined && src.length > 0,
      6); // A defined and non-empty `src` or `image` must be provided

  /**
   * @type {ol.ImageState}
   */
  var imageState = options.src !== undefined ?
    ol.ImageState.IDLE : ol.ImageState.LOADED;

  /**
   * @private
   * @type {ol.Color}
   */
  this.color_ = options.color !== undefined ? ol.color.asArray(options.color) :
    null;

  /**
   * @private
   * @type {ol.style.IconImage}
   */
  this.iconImage_ = ol.style.IconImage.get(
      image, /** @type {string} */ (src), imgSize, this.crossOrigin_, imageState, this.color_);

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

  ol.style.Image.call(this, {
    opacity: opacity,
    rotation: rotation,
    scale: scale,
    snapToPixel: snapToPixel,
    rotateWithView: rotateWithView
  });

};
ol.inherits(ol.style.Icon, ol.style.Image);


/**
 * Clones the style. The underlying Image/HTMLCanvasElement is not cloned.
 * @return {ol.style.Icon} The cloned style.
 * @api
 */
ol.style.Icon.prototype.clone = function() {
  return new ol.style.Icon({
    anchor: this.anchor_.slice(),
    anchorOrigin: this.anchorOrigin_,
    anchorXUnits: this.anchorXUnits_,
    anchorYUnits: this.anchorYUnits_,
    crossOrigin: this.crossOrigin_,
    color: (this.color_ && this.color_.slice) ? this.color_.slice() : this.color_ || undefined,
    src: this.getSrc(),
    offset: this.offset_.slice(),
    offsetOrigin: this.offsetOrigin_,
    size: this.size_ !== null ? this.size_.slice() : undefined,
    opacity: this.getOpacity(),
    scale: this.getScale(),
    snapToPixel: this.getSnapToPixel(),
    rotation: this.getRotation(),
    rotateWithView: this.getRotateWithView()
  });
};


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
 * Get the icon color.
 * @return {ol.Color} Color.
 * @api
 */
ol.style.Icon.prototype.getColor = function() {
  return this.color_;
};


/**
 * Get the image icon.
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image|HTMLCanvasElement} Image or Canvas element.
 * @override
 * @api
 */
ol.style.Icon.prototype.getImage = function(pixelRatio) {
  return this.iconImage_.getImage(pixelRatio);
};


/**
 * @override
 */
ol.style.Icon.prototype.getImageSize = function() {
  return this.iconImage_.getSize();
};


/**
 * @override
 */
ol.style.Icon.prototype.getHitDetectionImageSize = function() {
  return this.getImageSize();
};


/**
 * @override
 */
ol.style.Icon.prototype.getImageState = function() {
  return this.iconImage_.getImageState();
};


/**
 * @override
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
 * @override
 */
ol.style.Icon.prototype.listenImageChange = function(listener, thisArg) {
  return ol.events.listen(this.iconImage_, ol.events.EventType.CHANGE,
      listener, thisArg);
};


/**
 * Load not yet loaded URI.
 * When rendering a feature with an icon style, the vector renderer will
 * automatically call this method. However, you might want to call this
 * method yourself for preloading or other purposes.
 * @override
 * @api
 */
ol.style.Icon.prototype.load = function() {
  this.iconImage_.load();
};


/**
 * @override
 */
ol.style.Icon.prototype.unlistenImageChange = function(listener, thisArg) {
  ol.events.unlisten(this.iconImage_, ol.events.EventType.CHANGE,
      listener, thisArg);
};
