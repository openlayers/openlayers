goog.provide('ol.source.SingleImageWMS');

goog.require('ol.Image');
goog.require('ol.ImageUrlFunction');
goog.require('ol.extent');
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
      ol.extent.containsExtent(image.getExtent(), extent)) {
    return image;
  }

  extent = extent.slice();
  ol.extent.scaleFromCenter(extent, this.ratio_);
  var width = (extent[1] - extent[0]) / resolution;
  var height = (extent[3] - extent[2]) / resolution;
  var size = [width, height];

  this.image_ = this.createImage(extent, resolution, size, projection);
  return this.image_;
};
