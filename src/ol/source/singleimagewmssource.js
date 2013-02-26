goog.provide('ol.source.SingleImageWMS');

goog.require('goog.uri.utils');
goog.require('ol.Extent');
goog.require('ol.Image');
goog.require('ol.ImageUrlFunction');
goog.require('ol.Size');
goog.require('ol.source.IWMS');
goog.require('ol.source.ImageSource');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.ImageSource}
 * @implements {ol.source.IWMS}
 * @param {ol.source.SingleImageWMSOptions} options Options.
 */
ol.source.SingleImageWMS = function(options) {

  /**
   * @private
   * @type {ol.source.SingleImageWMSOptions}
   */
  this.options_ = options;

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    projection: options.projection,
    resolutions: options.resolutions
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = null;

  /**
   * FIXME configurable?
   * @private
   * @type {number}
   */
  this.ratio_ = 1.5;

};
goog.inherits(ol.source.SingleImageWMS, ol.source.ImageSource);


/**
 * @inheritDoc
 */
ol.source.SingleImageWMS.prototype.setProjection = function(projection) {
  goog.base(this, 'setProjection', projection);
  this.updateUrlFunction();
};


/**
 * @inheritDoc
 */
ol.source.SingleImageWMS.prototype.updateUrlFunction = function(opt_params) {
  var options = this.options_;
  if (goog.isDef(options.url)) {
    var params = goog.isDef(opt_params) ? opt_params : {};
    goog.object.extend(params, ol.source.wms.getBaseParams(this));

    var url = goog.uri.utils.appendParamsFromMap(options.url, params);
    this.imageUrlFunction = ol.ImageUrlFunction.createBboxParam(url);
  }
};


/**
 * @inheritDoc
 */
ol.source.SingleImageWMS.prototype.getImage = function(extent, resolution) {

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

  this.image_ = this.createImage(extent, resolution, size);
  return this.image_;
};
