goog.provide('ol.source.ImageStatic');

goog.require('ol.Image');
goog.require('ol.ImageUrlFunctionType');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.Image');



/**
 * @constructor
 * @extends {ol.source.Image}
 * @param {ol.source.ImageStaticOptions} options Options.
 * @todo stability experimental
 */
ol.source.ImageStatic = function(options) {

  var imageFunction = ol.source.ImageStatic.createImageFunction(
      options.url);

  var imageExtent = options.imageExtent;
  var imageSize = options.imageSize;
  var imageResolution = (imageExtent[3] - imageExtent[1]) / imageSize[1];
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
goog.inherits(ol.source.ImageStatic, ol.source.Image);


/**
 * @inheritDoc
 */
ol.source.ImageStatic.prototype.getImage =
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
ol.source.ImageStatic.createImageFunction = function(url) {
  return (
      /**
       * @param {ol.Extent} extent Extent.
       * @param {ol.Size} size Size.
       * @param {ol.proj.Projection} projection Projection.
       * @return {string|undefined} URL.
       */
      function(extent, size, projection) {
        return url;
      });
};
