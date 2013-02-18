goog.provide('ol.source.StaticImage');

goog.require('ol.Image');
goog.require('ol.ImageUrlFunctionType');
goog.require('ol.source.ImageSource');



/**
 * @constructor
 * @extends {ol.source.ImageSource}
 * @param {ol.source.StaticImageOptions} options Options.
 */
ol.source.StaticImage = function(options) {

  var imageFunction = ol.source.StaticImage.createImageFunction(
      options.url);

  var imageExtent = options.imageExtent;
  var imageSize = options.imageSize;
  var imageResolution = imageExtent.getHeight() / imageSize.height;

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    projection: options.projection,
    imageUrlFunction: imageFunction,
    resolutions: [imageResolution]
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = this.createImage(imageExtent, imageResolution, imageSize);

};
goog.inherits(ol.source.StaticImage, ol.source.ImageSource);


/**
 * @inheritDoc
 */
ol.source.StaticImage.prototype.getImage = function(extent, resolution) {
  if (extent.intersects(this.image_.getExtent())) {
    return this.image_;
  }
  return null;
};


/**
 * @param {string|undefined} url URL.
 * @return {ol.ImageUrlFunctionType} Function.
 */
ol.source.StaticImage.createImageFunction = function(url) {
  return function(extent, size) {
    return url;
  };
};
