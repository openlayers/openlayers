/**
 * @module ol/source/ImageStatic
 */
import {inherits} from '../index.js';
import _ol_Image_ from '../Image.js';
import _ol_ImageState_ from '../ImageState.js';
import {createCanvasContext2D} from '../dom.js';
import _ol_events_ from '../events.js';
import EventType from '../events/EventType.js';
import {intersects, getHeight, getWidth} from '../extent.js';
import {get as getProjection} from '../proj.js';
import _ol_source_Image_ from '../source/Image.js';

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
    projection: getProjection(options.projection)
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = new _ol_Image_(imageExtent, undefined, 1, options.url, crossOrigin, imageLoadFunction);

  /**
   * @private
   * @type {ol.Size}
   */
  this.imageSize_ = options.imageSize ? options.imageSize : null;

  _ol_events_.listen(this.image_, EventType.CHANGE,
      this.handleImageChange, this);

};

inherits(_ol_source_ImageStatic_, _ol_source_Image_);


/**
 * @inheritDoc
 */
_ol_source_ImageStatic_.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  if (intersects(extent, this.image_.getExtent())) {
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
    var resolution = getHeight(imageExtent) / imageHeight;
    var targetWidth = Math.ceil(getWidth(imageExtent) / resolution);
    if (targetWidth != imageWidth) {
      var context = createCanvasContext2D(targetWidth, imageHeight);
      var canvas = context.canvas;
      context.drawImage(image, 0, 0, imageWidth, imageHeight,
          0, 0, canvas.width, canvas.height);
      this.image_.setImage(canvas);
    }
  }
  _ol_source_Image_.prototype.handleImageChange.call(this, evt);
};
export default _ol_source_ImageStatic_;
