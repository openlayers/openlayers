goog.provide('ol.source.StaticImage');

goog.require('ol.Image');
goog.require('ol.ImageUrlFunctionType');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.ImageSource');



/**
 * @constructor
 * @extends {ol.source.ImageSource}
 * @param {ol.source.StaticImageOptions} options Static image options.
 */
ol.source.StaticImage = function(options) {

  var imageFunction = ol.source.StaticImage.createImageFunction(
      options.url);

  var imageExtent = options.imageExtent;
  var imageSize = options.imageSize;
  var imageResolution = (imageExtent[3] - imageExtent[2]) / imageSize[1];
  var projection = ol.proj.get(options.projection);

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
  this.image_ = this.createImage(
      imageExtent, imageResolution, imageSize, projection);

};
goog.inherits(ol.source.StaticImage, ol.source.ImageSource);


/**
 * @inheritDoc
 */
ol.source.StaticImage.prototype.getImage =
    function(extent, resolution, projection) {
  if (ol.extent.intersects(extent, this.image_.getExtent())) {
    return this.image_;
  }
  return null;
};


/**
 * @param {string|undefined} url URL.
 * @return {ol.ImageUrlFunctionType} Function.
 */
ol.source.StaticImage.createImageFunction = function(url) {
  return (
      /**
       * @param {ol.Extent} extent Extent.
       * @param {ol.Size} size Size.
       * @param {ol.Projection} projection Projection.
       * @return {string|undefined} URL.
       */
      function(extent, size, projection) {
        return url;
      });
};
