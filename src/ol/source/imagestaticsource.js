goog.provide('ol.source.ImageStatic');

goog.require('ol.Image');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.Image');



/**
 * @classdesc
 * An image source for 'static', that is, non-georeferenced, images.
 * See examples/static-image for example.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageStaticOptions} options Options.
 * @api stable
 */
ol.source.ImageStatic = function(options) {

  var attributions = goog.isDef(options.attributions) ?
      options.attributions : null;
  var crossOrigin = goog.isDef(options.crossOrigin) ?
      options.crossOrigin : null;
  var imageExtent = options.imageExtent;
  var imageSize = options.imageSize;
  var imageResolution = (imageExtent[3] - imageExtent[1]) / imageSize[1];
  var imageUrl = options.url;
  var projection = ol.proj.get(options.projection);

  goog.base(this, {
    attributions: attributions,
    logo: options.logo,
    projection: projection,
    resolutions: [imageResolution]
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = new ol.Image(imageExtent, imageResolution, 1, attributions,
      imageUrl, crossOrigin);

};
goog.inherits(ol.source.ImageStatic, ol.source.Image);


/**
 * @inheritDoc
 */
ol.source.ImageStatic.prototype.getImage =
    function(extent, resolution, pixelRatio, projection) {
  if (ol.extent.intersects(extent, this.image_.getExtent())) {
    return this.image_;
  }
  return null;
};
