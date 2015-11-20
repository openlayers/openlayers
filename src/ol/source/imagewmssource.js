// FIXME cannot be shared between maps with different projections

goog.provide('ol.source.ImageWMS');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.uri.utils');
goog.require('ol');
goog.require('ol.Image');
goog.require('ol.ImageLoadFunctionType');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.Image');
goog.require('ol.source.wms');
goog.require('ol.source.wms.ServerType');



/**
 * @classdesc
 * Source for WMS servers providing single, untiled images.
 *
 * @constructor
 * @fires ol.source.ImageEvent
 * @extends {ol.source.Image}
 * @param {olx.source.ImageWMSOptions=} opt_options Options.
 * @api stable
 */
ol.source.ImageWMS = function(opt_options) {

  var options = opt_options || {};

  goog.base(this, {
    attributions: options.attributions,
    logo: options.logo,
    projection: options.projection,
    resolutions: options.resolutions
  });

  /**
   * @private
   * @type {?string}
   */
  this.crossOrigin_ =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.url_ = options.url;

  /**
   * @private
   * @type {ol.ImageLoadFunctionType}
   */
  this.imageLoadFunction_ = options.imageLoadFunction !== undefined ?
      options.imageLoadFunction : ol.source.Image.defaultImageLoadFunction;

  /**
   * @private
   * @type {Object}
   */
  this.params_ = options.params;

  /**
   * @private
   * @type {boolean}
   */
  this.v13_ = true;
  this.updateV13_();

  /**
   * @private
   * @type {ol.source.wms.ServerType|undefined}
   */
  this.serverType_ =
      /** @type {ol.source.wms.ServerType|undefined} */ (options.serverType);

  /**
   * @private
   * @type {boolean}
   */
  this.hidpi_ = options.hidpi !== undefined ? options.hidpi : true;

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.imageSize_ = [0, 0];

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.ratio_ = options.ratio !== undefined ? options.ratio : 1.5;

};
goog.inherits(ol.source.ImageWMS, ol.source.Image);


/**
 * @const
 * @type {ol.Size}
 * @private
 */
ol.source.ImageWMS.GETFEATUREINFO_IMAGE_SIZE_ = [101, 101];


/**
 * Return the GetFeatureInfo URL for the passed coordinate, resolution, and
 * projection. Return `undefined` if the GetFeatureInfo URL cannot be
 * constructed.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {ol.proj.ProjectionLike} projection Projection.
 * @param {!Object} params GetFeatureInfo params. `INFO_FORMAT` at least should
 *     be provided. If `QUERY_LAYERS` is not provided then the layers specified
 *     in the `LAYERS` parameter will be used. `VERSION` should not be
 *     specified here.
 * @return {string|undefined} GetFeatureInfo URL.
 * @api stable
 */
ol.source.ImageWMS.prototype.getGetFeatureInfoUrl =
    function(coordinate, resolution, projection, params) {

  goog.asserts.assert(!('VERSION' in params),
      'key VERSION is not allowed in params');

  if (this.url_ === undefined) {
    return undefined;
  }

  var extent = ol.extent.getForViewAndSize(
      coordinate, resolution, 0,
      ol.source.ImageWMS.GETFEATUREINFO_IMAGE_SIZE_);

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': ol.DEFAULT_WMS_VERSION,
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': this.params_['LAYERS']
  };
  goog.object.extend(baseParams, this.params_, params);

  var x = Math.floor((coordinate[0] - extent[0]) / resolution);
  var y = Math.floor((extent[3] - coordinate[1]) / resolution);
  baseParams[this.v13_ ? 'I' : 'X'] = x;
  baseParams[this.v13_ ? 'J' : 'Y'] = y;

  return this.getRequestUrl_(
      extent, ol.source.ImageWMS.GETFEATUREINFO_IMAGE_SIZE_,
      1, ol.proj.get(projection), baseParams);
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 * @api stable
 */
ol.source.ImageWMS.prototype.getParams = function() {
  return this.params_;
};


/**
 * @inheritDoc
 */
ol.source.ImageWMS.prototype.getImageInternal =
    function(extent, resolution, pixelRatio, projection) {

  if (this.url_ === undefined) {
    return null;
  }

  resolution = this.findNearestResolution(resolution);

  if (pixelRatio != 1 && (!this.hidpi_ || this.serverType_ === undefined)) {
    pixelRatio = 1;
  }

  extent = extent.slice();
  var centerX = (extent[0] + extent[2]) / 2;
  var centerY = (extent[1] + extent[3]) / 2;

  var imageResolution = resolution / pixelRatio;
  var imageWidth = ol.extent.getWidth(extent) / imageResolution;
  var imageHeight = ol.extent.getHeight(extent) / imageResolution;

  var image = this.image_;
  if (image &&
      this.renderedRevision_ == this.getRevision() &&
      image.getResolution() == resolution &&
      image.getPixelRatio() == pixelRatio &&
      ol.extent.containsExtent(image.getExtent(), extent)) {
    return image;
  }

  if (this.ratio_ != 1) {
    var halfWidth = this.ratio_ * ol.extent.getWidth(extent) / 2;
    var halfHeight = this.ratio_ * ol.extent.getHeight(extent) / 2;
    extent[0] = centerX - halfWidth;
    extent[1] = centerY - halfHeight;
    extent[2] = centerX + halfWidth;
    extent[3] = centerY + halfHeight;
  }

  var params = {
    'SERVICE': 'WMS',
    'VERSION': ol.DEFAULT_WMS_VERSION,
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  goog.object.extend(params, this.params_);

  this.imageSize_[0] = Math.ceil(imageWidth * this.ratio_);
  this.imageSize_[1] = Math.ceil(imageHeight * this.ratio_);

  var url = this.getRequestUrl_(extent, this.imageSize_, pixelRatio,
      projection, params);

  this.image_ = new ol.Image(extent, resolution, pixelRatio,
      this.getAttributions(), url, this.crossOrigin_, this.imageLoadFunction_);

  this.renderedRevision_ = this.getRevision();

  goog.events.listen(this.image_, goog.events.EventType.CHANGE,
      this.handleImageChange, false, this);

  return this.image_;

};


/**
 * Return the image load function of the source.
 * @return {ol.ImageLoadFunctionType} The image load function.
 * @api
 */
ol.source.ImageWMS.prototype.getImageLoadFunction = function() {
  return this.imageLoadFunction_;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @param {Object} params Params.
 * @return {string} Request URL.
 * @private
 */
ol.source.ImageWMS.prototype.getRequestUrl_ =
    function(extent, size, pixelRatio, projection, params) {

  goog.asserts.assert(this.url_ !== undefined, 'url is defined');

  params[this.v13_ ? 'CRS' : 'SRS'] = projection.getCode();

  if (!('STYLES' in this.params_)) {
    /* jshint -W053 */
    params['STYLES'] = new String('');
    /* jshint +W053 */
  }

  if (pixelRatio != 1) {
    switch (this.serverType_) {
      case ol.source.wms.ServerType.GEOSERVER:
        var dpi = (90 * pixelRatio + 0.5) | 0;
        if ('FORMAT_OPTIONS' in params) {
          params['FORMAT_OPTIONS'] += ';dpi:' + dpi;
        } else {
          params['FORMAT_OPTIONS'] = 'dpi:' + dpi;
        }
        break;
      case ol.source.wms.ServerType.MAPSERVER:
        params['MAP_RESOLUTION'] = 90 * pixelRatio;
        break;
      case ol.source.wms.ServerType.CARMENTA_SERVER:
      case ol.source.wms.ServerType.QGIS:
        params['DPI'] = 90 * pixelRatio;
        break;
      default:
        goog.asserts.fail('unknown serverType configured');
        break;
    }
  }

  params['WIDTH'] = size[0];
  params['HEIGHT'] = size[1];

  var axisOrientation = projection.getAxisOrientation();
  var bbox;
  if (this.v13_ && axisOrientation.substr(0, 2) == 'ne') {
    bbox = [extent[1], extent[0], extent[3], extent[2]];
  } else {
    bbox = extent;
  }
  params['BBOX'] = bbox.join(',');

  return goog.uri.utils.appendParamsFromMap(this.url_, params);
};


/**
 * Return the URL used for this WMS source.
 * @return {string|undefined} URL.
 * @api stable
 */
ol.source.ImageWMS.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Set the image load function of the source.
 * @param {ol.ImageLoadFunctionType} imageLoadFunction Image load function.
 * @api
 */
ol.source.ImageWMS.prototype.setImageLoadFunction = function(
    imageLoadFunction) {
  this.image_ = null;
  this.imageLoadFunction_ = imageLoadFunction;
  this.changed();
};


/**
 * Set the URL to use for requests.
 * @param {string|undefined} url URL.
 * @api stable
 */
ol.source.ImageWMS.prototype.setUrl = function(url) {
  if (url != this.url_) {
    this.url_ = url;
    this.image_ = null;
    this.changed();
  }
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 * @api stable
 */
ol.source.ImageWMS.prototype.updateParams = function(params) {
  goog.object.extend(this.params_, params);
  this.updateV13_();
  this.image_ = null;
  this.changed();
};


/**
 * @private
 */
ol.source.ImageWMS.prototype.updateV13_ = function() {
  var version =
      goog.object.get(this.params_, 'VERSION', ol.DEFAULT_WMS_VERSION);
  this.v13_ = goog.string.compareVersions(version, '1.3') >= 0;
};
