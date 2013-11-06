goog.provide('ol.source.ImageWMS');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.Image');
goog.require('ol.ImageUrlFunction');
goog.require('ol.extent');
goog.require('ol.source.Image');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.Image}
 * @param {ol.source.ImageWMSOptions} options Options.
 * @todo stability experimental
 */
ol.source.ImageWMS = function(options) {

  /**
   * @private
   * @type {Object}
   */
  this.params_ = options.params;

  var imageUrlFunction = goog.isDef(options.url) ?
      ol.ImageUrlFunction.createFromParamsFunction(
          options.url, this.params_, ol.source.wms.getUrl) :
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
goog.inherits(ol.source.ImageWMS, ol.source.Image);


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 */
ol.source.ImageWMS.prototype.getParams = function() {
  return this.params_;
};


/**
 * @inheritDoc
 */
ol.source.ImageWMS.prototype.getImage =
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
  var width = (extent[2] - extent[0]) / resolution;
  var height = (extent[3] - extent[1]) / resolution;
  var size = [width, height];

  this.image_ = this.createImage(extent, resolution, size, projection);
  return this.image_;
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 */
ol.source.ImageWMS.prototype.updateParams = function(params) {
  goog.object.extend(this.params_, params);
  this.image_ = null;
  this.dispatchChangeEvent();
};
