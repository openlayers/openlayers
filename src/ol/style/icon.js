import _ol_ from '../index';
import _ol_ImageState_ from '../imagestate';
import _ol_asserts_ from '../asserts';
import _ol_color_ from '../color';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_style_IconAnchorUnits_ from '../style/iconanchorunits';
import _ol_style_IconImage_ from '../style/iconimage';
import _ol_style_IconOrigin_ from '../style/iconorigin';
import _ol_style_Image_ from '../style/image';

/**
 * @classdesc
 * Set icon style for vector features.
 *
 * @constructor
 * @param {olx.style.IconOptions=} opt_options Options.
 * @extends {ol.style.Image}
 * @api
 */
var _ol_style_Icon_ = function(opt_options) {

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
    options.anchorOrigin : _ol_style_IconOrigin_.TOP_LEFT;

  /**
   * @private
   * @type {ol.style.IconAnchorUnits}
   */
  this.anchorXUnits_ = options.anchorXUnits !== undefined ?
    options.anchorXUnits : _ol_style_IconAnchorUnits_.FRACTION;

  /**
   * @private
   * @type {ol.style.IconAnchorUnits}
   */
  this.anchorYUnits_ = options.anchorYUnits !== undefined ?
    options.anchorYUnits : _ol_style_IconAnchorUnits_.FRACTION;

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

  _ol_asserts_.assert(!(src !== undefined && image),
      4); // `image` and `src` cannot be provided at the same time
  _ol_asserts_.assert(!image || (image && imgSize),
      5); // `imgSize` must be set when `image` is provided

  if ((src === undefined || src.length === 0) && image) {
    src = image.src || _ol_.getUid(image).toString();
  }
  _ol_asserts_.assert(src !== undefined && src.length > 0,
      6); // A defined and non-empty `src` or `image` must be provided

  /**
   * @type {ol.ImageState}
   */
  var imageState = options.src !== undefined ?
    _ol_ImageState_.IDLE : _ol_ImageState_.LOADED;

  /**
   * @private
   * @type {ol.Color}
   */
  this.color_ = options.color !== undefined ? _ol_color_.asArray(options.color) :
    null;

  /**
   * @private
   * @type {ol.style.IconImage}
   */
  this.iconImage_ = _ol_style_IconImage_.get(
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
    options.offsetOrigin : _ol_style_IconOrigin_.TOP_LEFT;

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

  _ol_style_Image_.call(this, {
    opacity: opacity,
    rotation: rotation,
    scale: scale,
    snapToPixel: snapToPixel,
    rotateWithView: rotateWithView
  });

};

_ol_.inherits(_ol_style_Icon_, _ol_style_Image_);


/**
 * Clones the style.
 * @return {ol.style.Icon} The cloned style.
 * @api
 */
_ol_style_Icon_.prototype.clone = function() {
  var oldImage = this.getImage(1);
  var newImage;
  if (this.iconImage_.getImageState() === _ol_ImageState_.LOADED) {
    if (oldImage.tagName.toUpperCase() === 'IMG') {
      newImage = /** @type {Image} */ (oldImage.cloneNode(true));
    } else {
      newImage = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
      var context = newImage.getContext('2d');
      newImage.width = oldImage.width;
      newImage.height = oldImage.height;
      context.drawImage(oldImage, 0, 0);
    }
  }
  return new _ol_style_Icon_({
    anchor: this.anchor_.slice(),
    anchorOrigin: this.anchorOrigin_,
    anchorXUnits: this.anchorXUnits_,
    anchorYUnits: this.anchorYUnits_,
    crossOrigin: this.crossOrigin_,
    color: (this.color_ && this.color_.slice) ? this.color_.slice() : this.color_ || undefined,
    img: newImage ? newImage : undefined,
    imgSize: newImage ? this.iconImage_.getSize().slice() : undefined,
    src: newImage ? undefined : this.getSrc(),
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
_ol_style_Icon_.prototype.getAnchor = function() {
  if (this.normalizedAnchor_) {
    return this.normalizedAnchor_;
  }
  var anchor = this.anchor_;
  var size = this.getSize();
  if (this.anchorXUnits_ == _ol_style_IconAnchorUnits_.FRACTION ||
      this.anchorYUnits_ == _ol_style_IconAnchorUnits_.FRACTION) {
    if (!size) {
      return null;
    }
    anchor = this.anchor_.slice();
    if (this.anchorXUnits_ == _ol_style_IconAnchorUnits_.FRACTION) {
      anchor[0] *= size[0];
    }
    if (this.anchorYUnits_ == _ol_style_IconAnchorUnits_.FRACTION) {
      anchor[1] *= size[1];
    }
  }

  if (this.anchorOrigin_ != _ol_style_IconOrigin_.TOP_LEFT) {
    if (!size) {
      return null;
    }
    if (anchor === this.anchor_) {
      anchor = this.anchor_.slice();
    }
    if (this.anchorOrigin_ == _ol_style_IconOrigin_.TOP_RIGHT ||
        this.anchorOrigin_ == _ol_style_IconOrigin_.BOTTOM_RIGHT) {
      anchor[0] = -anchor[0] + size[0];
    }
    if (this.anchorOrigin_ == _ol_style_IconOrigin_.BOTTOM_LEFT ||
        this.anchorOrigin_ == _ol_style_IconOrigin_.BOTTOM_RIGHT) {
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
_ol_style_Icon_.prototype.getColor = function() {
  return this.color_;
};


/**
 * Get the image icon.
 * @param {number} pixelRatio Pixel ratio.
 * @return {Image|HTMLCanvasElement} Image or Canvas element.
 * @override
 * @api
 */
_ol_style_Icon_.prototype.getImage = function(pixelRatio) {
  return this.iconImage_.getImage(pixelRatio);
};


/**
 * @override
 */
_ol_style_Icon_.prototype.getImageSize = function() {
  return this.iconImage_.getSize();
};


/**
 * @override
 */
_ol_style_Icon_.prototype.getHitDetectionImageSize = function() {
  return this.getImageSize();
};


/**
 * @override
 */
_ol_style_Icon_.prototype.getImageState = function() {
  return this.iconImage_.getImageState();
};


/**
 * @override
 */
_ol_style_Icon_.prototype.getHitDetectionImage = function(pixelRatio) {
  return this.iconImage_.getHitDetectionImage(pixelRatio);
};


/**
 * @inheritDoc
 * @api
 */
_ol_style_Icon_.prototype.getOrigin = function() {
  if (this.origin_) {
    return this.origin_;
  }
  var offset = this.offset_;

  if (this.offsetOrigin_ != _ol_style_IconOrigin_.TOP_LEFT) {
    var size = this.getSize();
    var iconImageSize = this.iconImage_.getSize();
    if (!size || !iconImageSize) {
      return null;
    }
    offset = offset.slice();
    if (this.offsetOrigin_ == _ol_style_IconOrigin_.TOP_RIGHT ||
        this.offsetOrigin_ == _ol_style_IconOrigin_.BOTTOM_RIGHT) {
      offset[0] = iconImageSize[0] - size[0] - offset[0];
    }
    if (this.offsetOrigin_ == _ol_style_IconOrigin_.BOTTOM_LEFT ||
        this.offsetOrigin_ == _ol_style_IconOrigin_.BOTTOM_RIGHT) {
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
_ol_style_Icon_.prototype.getSrc = function() {
  return this.iconImage_.getSrc();
};


/**
 * @inheritDoc
 * @api
 */
_ol_style_Icon_.prototype.getSize = function() {
  return !this.size_ ? this.iconImage_.getSize() : this.size_;
};


/**
 * @override
 */
_ol_style_Icon_.prototype.listenImageChange = function(listener, thisArg) {
  return _ol_events_.listen(this.iconImage_, _ol_events_EventType_.CHANGE,
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
_ol_style_Icon_.prototype.load = function() {
  this.iconImage_.load();
};


/**
 * @override
 */
_ol_style_Icon_.prototype.unlistenImageChange = function(listener, thisArg) {
  _ol_events_.unlisten(this.iconImage_, _ol_events_EventType_.CHANGE,
      listener, thisArg);
};
export default _ol_style_Icon_;
