goog.provide('ol.source.SingleImageWMS');

goog.require('goog.asserts');
goog.require('ol.Image');
goog.require('ol.ImageUrlFunction');
goog.require('ol.extent');
goog.require('ol.source.FeatureInfoSource');
goog.require('ol.source.ImageSource');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.ImageSource}
 * @implements {ol.source.FeatureInfoSource}
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
   * @type {ol.source.WMSGetFeatureInfoOptions}
   */
  this.getFeatureInfoOptions_ = goog.isDef(options.getFeatureInfoOptions) ?
      options.getFeatureInfoOptions : {};

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


/**
 * @inheritDoc
 */
ol.source.SingleImageWMS.prototype.getFeatureInfoForPixel =
    function(pixel, map, success, opt_error) {
  var view2D = map.getView().getView2D(),
      projection = view2D.getProjection(),
      size = map.getSize(),
      bottomLeft = map.getCoordinateFromPixel([0, size[1]]),
      topRight = map.getCoordinateFromPixel([size[0], 0]),
      extent = [bottomLeft[0], topRight[0], bottomLeft[1], topRight[1]],
      url = this.imageUrlFunction(extent, size, projection);
  goog.asserts.assert(goog.isDef(url),
      'ol.source.SingleImageWMS#imageUrlFunction does not return a url');
  ol.source.wms.getFeatureInfo(url, pixel, this.getFeatureInfoOptions_, success,
      opt_error);
};
