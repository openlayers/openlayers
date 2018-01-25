/**
 * @module ol/source/ImageStatic
 */
import {inherits} from '../index.js';
import _ol_Image_ from '../Image.js';
import ImageState from '../ImageState.js';
import {createCanvasContext2D} from '../dom.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';
import {intersects, getHeight, getWidth} from '../extent.js';
import {get as getProjection} from '../proj.js';
import ImageSource from '../source/Image.js';

/**
 * @classdesc
 * A layer source for displaying a single, static image.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageStaticOptions} options Options.
 * @api
 */
const Static = function(options) {
  const imageExtent = options.imageExtent;

  const crossOrigin = options.crossOrigin !== undefined ?
    options.crossOrigin : null;

  const /** @type {ol.ImageLoadFunctionType} */ imageLoadFunction =
      options.imageLoadFunction !== undefined ?
        options.imageLoadFunction : ImageSource.defaultImageLoadFunction;

  ImageSource.call(this, {
    attributions: options.attributions,
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

  listen(this.image_, EventType.CHANGE,
    this.handleImageChange, this);

};

inherits(Static, ImageSource);


/**
 * @inheritDoc
 */
Static.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  if (intersects(extent, this.image_.getExtent())) {
    return this.image_;
  }
  return null;
};


/**
 * @inheritDoc
 */
Static.prototype.handleImageChange = function(evt) {
  if (this.image_.getState() == ImageState.LOADED) {
    const imageExtent = this.image_.getExtent();
    const image = this.image_.getImage();
    let imageWidth, imageHeight;
    if (this.imageSize_) {
      imageWidth = this.imageSize_[0];
      imageHeight = this.imageSize_[1];
    } else {
      imageWidth = image.width;
      imageHeight = image.height;
    }
    const resolution = getHeight(imageExtent) / imageHeight;
    const targetWidth = Math.ceil(getWidth(imageExtent) / resolution);
    if (targetWidth != imageWidth) {
      const context = createCanvasContext2D(targetWidth, imageHeight);
      const canvas = context.canvas;
      context.drawImage(image, 0, 0, imageWidth, imageHeight,
        0, 0, canvas.width, canvas.height);
      this.image_.setImage(canvas);
    }
  }
  ImageSource.prototype.handleImageChange.call(this, evt);
};
export default Static;
