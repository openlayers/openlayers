/**
 * @module ol/style/Icon
 */
import {getUid, inherits} from '../index.js';
import ImageState from '../ImageState.js';
import {assert} from '../asserts.js';
import {asArray} from '../color.js';
import {listen, unlisten} from '../events.js';
import EventType from '../events/EventType.js';
import IconAnchorUnits from '../style/IconAnchorUnits.js';
import IconImage from '../style/IconImage.js';
import IconOrigin from '../style/IconOrigin.js';
import ImageStyle from '../style/Image.js';

/**
 * @classdesc
 * Set icon style for vector features.
 *
 * @constructor
 * @param {olx.style.IconOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @api
 */
const Icon = function(opt_options) {

  const options = opt_options || {};

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
    options.anchorOrigin : IconOrigin.TOP_LEFT;

  /**
   * @private
   * @type {ol.style.IconAnchorUnits}
   */
  this.anchorXUnits_ = options.anchorXUnits !== undefined ?
    options.anchorXUnits : IconAnchorUnits.FRACTION;

  /**
   * @private
   * @type {ol.style.IconAnchorUnits}
   */
  this.anchorYUnits_ = options.anchorYUnits !== undefined ?
    options.anchorYUnits : IconAnchorUnits.FRACTION;

  /**
   * @private
   * @type {?string}
   */
  this.crossOrigin_ =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

  /**
   * @type {Image|HTMLCanvasElement}
   */
  const image = options.img !== undefined ? options.img : null;

  /**
   * @type {ol.Size}
   */
  const imgSize = options.imgSize !== undefined ? options.imgSize : null;

  /**
   * @type {string|undefined}
   */
  let src = options.src;

  assert(!(src !== undefined && image),
    4); // `image` and `src` cannot be provided at the same time
  assert(!image || (image && imgSize),
    5); // `imgSize` must be set when `image` is provided

  if ((src === undefined || src.length === 0) && image) {
    src = image.src || getUid(image).toString();
  }
  assert(src !== undefined && src.length > 0,
    6); // A defined and non-empty `src` or `image` must be provided

  /**
   * @type {ol.ImageState}
   */
  const imageState = options.src !== undefined ?
    ImageState.IDLE : ImageState.LOADED;

  /**
   * @private
   * @type {ol.Color}
   */
  this.color_ = options.color !== undefined ? asArray(options.color) : null;

  /**
   * @private
   * @type {ol.style.IconImage}
   */
  this.iconImage_ = IconImage.get(
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
    options.offsetOrigin : IconOrigin.TOP_LEFT;

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
  const opacity = options.opacity !== undefined ? options.opacity : 1;

  /**
   * @type {boolean}
   */
  const rotateWithView = options.rotateWithView !== undefined ?
    options.rotateWithView : false;

  /**
   * @type {number}
   */
  const rotation = options.rotation !== undefined ? options.rotation : 0;

  /**
   * @type {number}
   */
  const scale = options.scale !== undefined ? options.scale : 1;

  /**
   * @type {boolean}
   */
  const snapToPixel = options.snapToPixel !== undefined ?
    options.snapToPixel : true;

  ImageStyle.call(this, {
    opacity: opacity,
    rotation: rotation,
    scale: scale,
    snapToPixel: snapToPixel,
    rotateWithView: rotateWithView
  });

};

inherits(Icon, ImageStyle);


/**
 * Clones the style. The underlying Image/HTMLCanvasElement is not cloned.
 * @return {ol.style.Icon} The cloned style.
 * @api
 */
Icon.prototype.clone = function() {
  return new Icon({
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
Icon.prototype.getAnchor = function() {
  if (this.normalizedAnchor_) {
    return this.normalizedAnchor_;
  }
  let anchor = this.anchor_;
  const size = this.getSize();
  if (this.anchorXUnits_ == IconAnchorUnits.FRACTION ||
      this.anchorYUnits_ == IconAnchorUnits.FRACTION) {
    if (!size) {
      return null;
    }
    anchor = this.anchor_.slice();
    if (this.anchorXUnits_ == IconAnchorUnits.FRACTION) {
      anchor[0] *= size[0];
    }
    if (this.anchorYUnits_ == IconAnchorUnits.FRACTION) {
      anchor[1] *= size[1];
    }
  }

  if (this.anchorOrigin_ != IconOrigin.TOP_LEFT) {
    if (!size) {
      return null;
    }
    if (anchor === this.anchor_) {
      anchor = this.anchor_.slice();
    }
    if (this.anchorOrigin_ == IconOrigin.TOP_RIGHT ||
        this.anchorOrigin_ == IconOrigin.BOTTOM_RIGHT) {
      anchor[0] = -anchor[0] + size[0];
    }
    if (this.anchorOrigin_ == IconOrigin.BOTTOM_LEFT ||
        this.anchorOrigin_ == IconOrigin.BOTTOM_RIGHT) {
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
Icon.prototype.getColor = function() {
  return this.color_;
};


/**
 * Get the image icon.
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image|HTMLCanvasElement} Image or Canvas element.
 * @override
 * @api
 */
Icon.prototype.getImage = function(pixelRatio) {
  return this.iconImage_.getImage(pixelRatio);
};


/**
 * @override
 */
Icon.prototype.getImageSize = function() {
  return this.iconImage_.getSize();
};


/**
 * @override
 */
Icon.prototype.getHitDetectionImageSize = function() {
  return this.getImageSize();
};


/**
 * @override
 */
Icon.prototype.getImageState = function() {
  return this.iconImage_.getImageState();
};


/**
 * @override
 */
Icon.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.iconImage_.getHitDetectionImage(pixelRatio);
};


/**
 * @inheritDoc
 * @api
 */
Icon.prototype.getOrigin = function() {
  if (this.origin_) {
    return this.origin_;
  }
  let offset = this.offset_;

  if (this.offsetOrigin_ != IconOrigin.TOP_LEFT) {
    const size = this.getSize();
    const iconImageSize = this.iconImage_.getSize();
    if (!size || !iconImageSize) {
      return null;
    }
    offset = offset.slice();
    if (this.offsetOrigin_ == IconOrigin.TOP_RIGHT ||
        this.offsetOrigin_ == IconOrigin.BOTTOM_RIGHT) {
      offset[0] = iconImageSize[0] - size[0] - offset[0];
    }
    if (this.offsetOrigin_ == IconOrigin.BOTTOM_LEFT ||
        this.offsetOrigin_ == IconOrigin.BOTTOM_RIGHT) {
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
Icon.prototype.getSrc = function() {
  return this.iconImage_.getSrc();
};


/**
 * @inheritDoc
 * @api
 */
Icon.prototype.getSize = function() {
  return !this.size_ ? this.iconImage_.getSize() : this.size_;
};


/**
 * @override
 */
Icon.prototype.listenImageChange = function(listener, thisArg) {
  return listen(this.iconImage_, EventType.CHANGE,
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
Icon.prototype.load = function() {
  this.iconImage_.load();
};


/**
 * @override
 */
Icon.prototype.unlistenImageChange = function(listener, thisArg) {
  unlisten(this.iconImage_, EventType.CHANGE,
    listener, thisArg);
};
export default Icon;
