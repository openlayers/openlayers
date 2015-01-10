goog.provide('ol.source.ImageStatic');

goog.require('goog.events');
goog.require('ol.Image');
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

  var attributions = goog.isDef(options.attributions) ?
      options.attributions : null;

  var imageExtent = options.imageExtent;

  var resolution, resolutions;
  if (goog.isDef(options.imageSize)) {
    resolution = ol.extent.getHeight(imageExtent) / options.imageSize[1];
    resolutions = [resolution];
  }

  var crossOrigin = goog.isDef(options.crossOrigin) ?
      options.crossOrigin : null;

  var imageLoadFunction = goog.isDef(options.imageLoadFunction) ?
      options.imageLoadFunction : ol.source.Image.defaultImageLoadFunction;

  goog.base(this, {
    attributions: attributions,
    logo: options.logo,
    projection: ol.proj.get(options.projection),
    resolutions: resolutions
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = new ol.Image(imageExtent, resolution, 1, attributions,
      options.url, crossOrigin, imageLoadFunction);

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
