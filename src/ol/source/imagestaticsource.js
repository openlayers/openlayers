goog.provide('ol.source.ImageStatic');

goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.Image');
goog.require('ol.ImageLoadFunctionType');
goog.require('ol.ImageState');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.Image');


/**
 * @classdesc
 * A layer source for displaying a single, static image.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageStaticOptions} options Options.
 * @api stable
 */
ol.source.ImageStatic = function(options) {

  var attributions = options.attributions !== undefined ?
      options.attributions : null;

  var imageExtent = options.imageExtent;

  var crossOrigin = options.crossOrigin !== undefined ?
      options.crossOrigin : null;

  var /** @type {ol.ImageLoadFunctionType} */ imageLoadFunction =
      options.imageLoadFunction !== undefined ?
      options.imageLoadFunction : ol.source.Image.defaultImageLoadFunction;

  goog.base(this, {
    attributions: attributions,
    logo: options.logo,
    projection: ol.proj.get(options.projection)
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = new ol.Image(imageExtent, undefined, 1, attributions,
      options.url, crossOrigin, imageLoadFunction);

  /**
   * @private
   * @type {ol.Size}
   */
  this.imageSize_ = options.imageSize ? options.imageSize : null;

  ol.events.listen(this.image_, ol.events.EventType.CHANGE,
      this.handleImageChange, false, this);

};
goog.inherits(ol.source.ImageStatic, ol.source.Image);


/**
 * @inheritDoc
 */
ol.source.ImageStatic.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  if (ol.extent.intersects(extent, this.image_.getExtent())) {
    return this.image_;
  }
  return null;
};


/**
 * @inheritDoc
 */
ol.source.ImageStatic.prototype.handleImageChange = function(evt) {
  if (this.image_.getState() == ol.ImageState.LOADED) {
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
    var resolution = ol.extent.getHeight(imageExtent) / imageHeight;
    var targetWidth = Math.ceil(ol.extent.getWidth(imageExtent) / resolution);
    if (targetWidth != imageWidth) {
      var canvas = /** @type {HTMLCanvasElement} */
          (document.createElement('canvas'));
      canvas.width = targetWidth;
      canvas.height = /** @type {number} */ (imageHeight);
      var context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, imageWidth, imageHeight,
          0, 0, canvas.width, canvas.height);
      this.image_.setImage(canvas);
    }
  }
  goog.base(this, 'handleImageChange', evt);
};
