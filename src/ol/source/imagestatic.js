goog.provide('ol.source.ImageStatic');

goog.require('ol');
goog.require('ol.Image');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.events.EventType');
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
  var imageExtent = options.imageExtent;

  var crossOrigin = options.crossOrigin !== undefined ?
      options.crossOrigin : null;

  var /** @type {ol.ImageLoadFunctionType} */ imageLoadFunction =
      options.imageLoadFunction !== undefined ?
      options.imageLoadFunction : ol.source.Image.defaultImageLoadFunction;

  ol.source.Image.call(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: ol.proj.get(options.projection)
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = new ol.Image(imageExtent, undefined, 1, this.getAttributions(),
      options.url, crossOrigin, imageLoadFunction);

  /**
   * @private
   * @type {ol.Size}
   */
  this.imageSize_ = options.imageSize ? options.imageSize : null;

  ol.events.listen(this.image_, ol.events.EventType.CHANGE,
      this.handleImageChange, this);

};
ol.inherits(ol.source.ImageStatic, ol.source.Image);


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
  if (this.image_.getState() == ol.Image.State.LOADED) {
    var imageExtent = this.image_.getExtent();
    var image = this.image_.getImage();
    var imageWidth, imageHeight;
    if (this.imageSize_) {
      imageWidth = this.imageSize_[0];
      imageHeight = this.imageSize_[1];
    } else {
      // TODO: remove the type cast when a closure-compiler > 20160315 is used.
      // see: https://github.com/google/closure-compiler/pull/1664
      imageWidth = /** @type {number} */ (image.width);
      imageHeight = /** @type {number} */ (image.height);
    }
    var resolution = ol.extent.getHeight(imageExtent) / imageHeight;
    var targetWidth = Math.ceil(ol.extent.getWidth(imageExtent) / resolution);
    if (targetWidth != imageWidth) {
      var context = ol.dom.createCanvasContext2D(targetWidth, imageHeight);
      var canvas = context.canvas;
      context.drawImage(image, 0, 0, imageWidth, imageHeight,
          0, 0, canvas.width, canvas.height);
      this.image_.setImage(canvas);
    }
  }
  ol.source.Image.prototype.handleImageChange.call(this, evt);
};
