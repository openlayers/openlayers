goog.provide('ol.source.SingleImageWMS');

goog.require('goog.uri.utils');
goog.require('ol.Extent');
goog.require('ol.Image');
goog.require('ol.ImageUrlFunction');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.source.ImageSource');



/**
 * @constructor
 * @extends {ol.source.ImageSource}
 * @param {ol.source.SingleImageWMSOptions} options Options.
 */
ol.source.SingleImageWMS = function(options) {

  var projection = ol.Projection.createProjection(
      options.projection, 'EPSG:3857');
  var projectionExtent = projection.getExtent();

  var extent = goog.isDef(options.extent) ?
      options.extent : projectionExtent;

  var version = goog.isDef(options.version) ?
      options.version : '1.3';

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': version,
    'REQUEST': 'GetMap',
    'STYLES': '',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  baseParams[version >= '1.3' ? 'CRS' : 'SRS'] = projection.getCode();
  goog.object.extend(baseParams, options.params);

  var axisOrientation = projection.getAxisOrientation();
  var imageUrlFunction;
  if (options.url) {
    var url = goog.uri.utils.appendParamsFromMap(
        options.url, baseParams);
    imageUrlFunction =
        ol.ImageUrlFunction.createBboxParam(url, axisOrientation);
  } else {
    imageUrlFunction =
        ol.ImageUrlFunction.nullImageUrlFunction;
  }

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: extent,
    projection: projection,
    resolutions: options.resolutions,
    imageUrlFunction: imageUrlFunction
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
ol.source.SingleImageWMS.prototype.getImage =
    function(extent, resolution) {
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
