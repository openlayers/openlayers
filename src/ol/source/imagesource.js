goog.provide('ol.source.ImageSource');

goog.require('goog.array');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Image');
goog.require('ol.ImageUrlFunction');
goog.require('ol.ImageUrlFunctionType');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.array');
goog.require('ol.source.Source');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            crossOrigin: (null|string|undefined),
 *            extent: (null|ol.Extent|undefined),
 *            projection: ol.ProjectionLike,
 *            resolutions: (Array.<number>|undefined),
 *            imageUrlFunction: (ol.ImageUrlFunctionType|
 *                undefined)}}
 */
ol.source.ImageSourceOptions;



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.ImageSourceOptions} options Single
 *     image source options.
 */
ol.source.ImageSource = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    projection: options.projection
  });

  /**
   * @protected
   * @type {ol.ImageUrlFunctionType}
   */
  this.imageUrlFunction =
      goog.isDef(options.imageUrlFunction) ?
          options.imageUrlFunction :
          ol.ImageUrlFunction.nullImageUrlFunction;

  /**
   * @private
   * @type {?string}
   */
  this.crossOrigin_ =
      goog.isDef(options.crossOrigin) ? options.crossOrigin : null;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.resolutions_ = goog.isDef(options.resolutions) ?
      options.resolutions : null;
  goog.asserts.assert(goog.isNull(this.resolutions_) ||
      goog.array.isSorted(this.resolutions_,
          function(a, b) {
            return b - a;
          }, true));

};
goog.inherits(ol.source.ImageSource, ol.source.Source);


/**
 * @protected
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {ol.Size} size Size.
 * @param {ol.Projection} projection Projection.
 * @return {ol.Image} Single image.
 */
ol.source.ImageSource.prototype.createImage =
    function(extent, resolution, size, projection) {
  var image = null;
  var imageUrl = this.imageUrlFunction(extent, size, projection);
  if (goog.isDef(imageUrl)) {
    image = new ol.Image(
        extent, resolution, imageUrl, this.crossOrigin_,
        this.getAttributions());
  }
  return image;
};


/**
 * @protected
 * @param {number} resolution Resolution.
 * @return {number} Resolution.
 */
ol.source.ImageSource.prototype.findNearestResolution =
    function(resolution) {
  if (!goog.isNull(this.resolutions_)) {
    var idx = ol.array.linearFindNearest(this.resolutions_, resolution);
    resolution = this.resolutions_[idx];
  }
  return resolution;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {ol.Projection} projection Projection.
 * @return {ol.Image} Single image.
 */
ol.source.ImageSource.prototype.getImage = goog.abstractMethod;
