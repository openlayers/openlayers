goog.provide('ol.source.ImageStatic');

goog.require('goog.events');
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

  var imageExtent = options.imageExtent;

  var resolution, resolutions;
  if (goog.isDef(options.imageSize)) {
    resolution = ol.extent.getHeight(imageExtent) / options.imageSize[1];
    resolutions = [resolution];
  }

  var crossOrigin = goog.isDef(options.crossOrigin) ?
      options.crossOrigin : null;

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
      options.url, crossOrigin);

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
