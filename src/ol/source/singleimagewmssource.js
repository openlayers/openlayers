goog.provide('ol.source.SingleImageWMS');

goog.require('ol.Extent');
goog.require('ol.Image');
goog.require('ol.ImageUrlFunction');
goog.require('ol.Size');
goog.require('ol.source.ImageSource');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.ImageSource}
 * @param {ol.source.SingleImageWMSOptions} options Options.
 */
ol.source.SingleImageWMS = function(options) {
  var imageUrlFunction = goog.isDef(options.url) ?
      ol.ImageUrlFunction.createFromParamsFunction(
          options.url, options.params, ol.source.wms.getUrl) :
      ol.ImageUrlFunction.nullImageUrlFunction;

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    projection: options.projection,
    resolutions: options.resolutions,
    imageUrlFunction: imageUrlFunction
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {number}
   */
  this.ratio_ = goog.isDef(options.ratio) ?
      options.ratio : 1.5;

};
goog.inherits(ol.source.SingleImageWMS, ol.source.ImageSource);


/**
 * @inheritDoc
 */
ol.source.SingleImageWMS.prototype.getImage =
    function(extent, resolution, projection) {
  resolution = this.findNearestResolution(resolution);

  var image = this.image_;
  if (!goog.isNull(image) &&
      image.getResolution() == resolution &&
      image.getExtent().containsExtent(extent)) {
    return image;
  }

  extent = new ol.Extent(extent.minX, extent.minY,
      extent.maxX, extent.maxY);
  extent.scaleFromCenter(this.ratio_);
  var width = extent.getWidth() / resolution;
  var height = extent.getHeight() / resolution;
  var size = new ol.Size(width, height);

  this.image_ = this.createImage(extent, resolution, size, projection);
  return this.image_;
};
