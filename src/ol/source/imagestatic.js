import _ol_ from '../index';
import _ol_Image_ from '../image';
import _ol_ImageState_ from '../imagestate';
import _ol_dom_ from '../dom';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_proj_ from '../proj';
import _ol_source_Image_ from '../source/image';

/**
 * @classdesc
 * A layer source for displaying a single, static image.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageStaticOptions} options Options.
 * @api
 */
var _ol_source_ImageStatic_ = function(options) {
  var imageExtent = options.imageExtent;

  var crossOrigin = options.crossOrigin !== undefined ?
    options.crossOrigin : null;

  var /** @type {ol.ImageLoadFunctionType} */ imageLoadFunction =
      options.imageLoadFunction !== undefined ?
        options.imageLoadFunction : _ol_source_Image_.defaultImageLoadFunction;

  _ol_source_Image_.call(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: _ol_proj_.get(options.projection)
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = new _ol_Image_(imageExtent, undefined, 1, this.getAttributions(),
      options.url, crossOrigin, imageLoadFunction);

  /**
   * @private
   * @type {ol.Size}
   */
  this.imageSize_ = options.imageSize ? options.imageSize : null;

  _ol_events_.listen(this.image_, _ol_events_EventType_.CHANGE,
      this.handleImageChange, this);

};

_ol_.inherits(_ol_source_ImageStatic_, _ol_source_Image_);


/**
 * @inheritDoc
 */
_ol_source_ImageStatic_.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  if (_ol_extent_.intersects(extent, this.image_.getExtent())) {
    return this.image_;
  }
  return null;
};


/**
 * @inheritDoc
 */
_ol_source_ImageStatic_.prototype.handleImageChange = function(evt) {
  if (this.image_.getState() == _ol_ImageState_.LOADED) {
    var imageExtent = this.image_.getExtent();
    var image = this.image_.getImage();
    var imageWidth, imageHeight;
    if (this.imageSize_) {
      imageWidth = this.imageSize_[0];
      imageHeight = this.imageSize_[1];
    } else {
      imageWidth = image.width;
      imageHeight = image.height;
    }
    var resolution = _ol_extent_.getHeight(imageExtent) / imageHeight;
    var targetWidth = Math.ceil(_ol_extent_.getWidth(imageExtent) / resolution);
    if (targetWidth != imageWidth) {
      var context = _ol_dom_.createCanvasContext2D(targetWidth, imageHeight);
      var canvas = context.canvas;
      context.drawImage(image, 0, 0, imageWidth, imageHeight,
          0, 0, canvas.width, canvas.height);
      this.image_.setImage(canvas);
    }
  }
  _ol_source_Image_.prototype.handleImageChange.call(this, evt);
};
export default _ol_source_ImageStatic_;
