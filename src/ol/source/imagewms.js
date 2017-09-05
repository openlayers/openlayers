// FIXME cannot be shared between maps with different projections

import _ol_ from '../index';
import _ol_Image_ from '../image';
import _ol_asserts_ from '../asserts';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_obj_ from '../obj';
import _ol_proj_ from '../proj';
import _ol_source_Image_ from '../source/image';
import _ol_source_WMSServerType_ from '../source/wmsservertype';
import _ol_string_ from '../string';
import _ol_uri_ from '../uri';

/**
 * @classdesc
 * Source for WMS servers providing single, untiled images.
 *
 * @constructor
 * @fires ol.source.Image.Event
 * @extends {ol.source.Image}
 * @param {olx.source.ImageWMSOptions=} opt_options Options.
 * @api
 */
var _ol_source_ImageWMS_ = function(opt_options) {

  var options = opt_options || {};

  _ol_source_Image_.call(this, {
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
    options.imageLoadFunction : _ol_source_Image_.defaultImageLoadFunction;

  /**
   * @private
   * @type {!Object}
   */
  this.params_ = options.params || {};

  /**
   * @private
   * @type {boolean}
   */
  this.v13_ = true;
  this.updateV13_();

  /**
   * @private
   * @type {ol.source.WMSServerType|undefined}
   */
  this.serverType_ = /** @type {ol.source.WMSServerType|undefined} */ (options.serverType);

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

_ol_.inherits(_ol_source_ImageWMS_, _ol_source_Image_);


/**
 * @const
 * @type {ol.Size}
 * @private
 */
_ol_source_ImageWMS_.GETFEATUREINFO_IMAGE_SIZE_ = [101, 101];


/**
 * Return the GetFeatureInfo URL for the passed coordinate, resolution, and
 * projection. Return `undefined` if the GetFeatureInfo URL cannot be
 * constructed.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {ol.ProjectionLike} projection Projection.
 * @param {!Object} params GetFeatureInfo params. `INFO_FORMAT` at least should
 *     be provided. If `QUERY_LAYERS` is not provided then the layers specified
 *     in the `LAYERS` parameter will be used. `VERSION` should not be
 *     specified here.
 * @return {string|undefined} GetFeatureInfo URL.
 * @api
 */
_ol_source_ImageWMS_.prototype.getGetFeatureInfoUrl = function(coordinate, resolution, projection, params) {
  if (this.url_ === undefined) {
    return undefined;
  }

  var extent = _ol_extent_.getForViewAndSize(
      coordinate, resolution, 0,
      _ol_source_ImageWMS_.GETFEATUREINFO_IMAGE_SIZE_);

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': _ol_.DEFAULT_WMS_VERSION,
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': this.params_['LAYERS']
  };
  _ol_obj_.assign(baseParams, this.params_, params);

  var x = Math.floor((coordinate[0] - extent[0]) / resolution);
  var y = Math.floor((extent[3] - coordinate[1]) / resolution);
  baseParams[this.v13_ ? 'I' : 'X'] = x;
  baseParams[this.v13_ ? 'J' : 'Y'] = y;

  return this.getRequestUrl_(
      extent, _ol_source_ImageWMS_.GETFEATUREINFO_IMAGE_SIZE_,
      1, _ol_proj_.get(projection), baseParams);
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 * @api
 */
_ol_source_ImageWMS_.prototype.getParams = function() {
  return this.params_;
};


/**
 * @inheritDoc
 */
_ol_source_ImageWMS_.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {

  if (this.url_ === undefined) {
    return null;
  }

  resolution = this.findNearestResolution(resolution);

  if (pixelRatio != 1 && (!this.hidpi_ || this.serverType_ === undefined)) {
    pixelRatio = 1;
  }

  var imageResolution = resolution / pixelRatio;

  var center = _ol_extent_.getCenter(extent);
  var viewWidth = Math.ceil(_ol_extent_.getWidth(extent) / imageResolution);
  var viewHeight = Math.ceil(_ol_extent_.getHeight(extent) / imageResolution);
  var viewExtent = _ol_extent_.getForViewAndSize(center, imageResolution, 0,
      [viewWidth, viewHeight]);
  var requestWidth = Math.ceil(this.ratio_ * _ol_extent_.getWidth(extent) / imageResolution);
  var requestHeight = Math.ceil(this.ratio_ * _ol_extent_.getHeight(extent) / imageResolution);
  var requestExtent = _ol_extent_.getForViewAndSize(center, imageResolution, 0,
      [requestWidth, requestHeight]);

  var image = this.image_;
  if (image &&
      this.renderedRevision_ == this.getRevision() &&
      image.getResolution() == resolution &&
      image.getPixelRatio() == pixelRatio &&
      _ol_extent_.containsExtent(image.getExtent(), viewExtent)) {
    return image;
  }

  var params = {
    'SERVICE': 'WMS',
    'VERSION': _ol_.DEFAULT_WMS_VERSION,
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  _ol_obj_.assign(params, this.params_);

  this.imageSize_[0] = Math.round(_ol_extent_.getWidth(requestExtent) / imageResolution);
  this.imageSize_[1] = Math.round(_ol_extent_.getHeight(requestExtent) / imageResolution);

  var url = this.getRequestUrl_(requestExtent, this.imageSize_, pixelRatio,
      projection, params);

  this.image_ = new _ol_Image_(requestExtent, resolution, pixelRatio,
      this.getAttributions(), url, this.crossOrigin_, this.imageLoadFunction_);

  this.renderedRevision_ = this.getRevision();

  _ol_events_.listen(this.image_, _ol_events_EventType_.CHANGE,
      this.handleImageChange, this);

  return this.image_;

};


/**
 * Return the image load function of the source.
 * @return {ol.ImageLoadFunctionType} The image load function.
 * @api
 */
_ol_source_ImageWMS_.prototype.getImageLoadFunction = function() {
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
_ol_source_ImageWMS_.prototype.getRequestUrl_ = function(extent, size, pixelRatio, projection, params) {

  _ol_asserts_.assert(this.url_ !== undefined, 9); // `url` must be configured or set using `#setUrl()`

  params[this.v13_ ? 'CRS' : 'SRS'] = projection.getCode();

  if (!('STYLES' in this.params_)) {
    params['STYLES'] = '';
  }

  if (pixelRatio != 1) {
    switch (this.serverType_) {
      case _ol_source_WMSServerType_.GEOSERVER:
        var dpi = (90 * pixelRatio + 0.5) | 0;
        if ('FORMAT_OPTIONS' in params) {
          params['FORMAT_OPTIONS'] += ';dpi:' + dpi;
        } else {
          params['FORMAT_OPTIONS'] = 'dpi:' + dpi;
        }
        break;
      case _ol_source_WMSServerType_.MAPSERVER:
        params['MAP_RESOLUTION'] = 90 * pixelRatio;
        break;
      case _ol_source_WMSServerType_.CARMENTA_SERVER:
      case _ol_source_WMSServerType_.QGIS:
        params['DPI'] = 90 * pixelRatio;
        break;
      default:
        _ol_asserts_.assert(false, 8); // Unknown `serverType` configured
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

  return _ol_uri_.appendParams(/** @type {string} */ (this.url_), params);
};


/**
 * Return the URL used for this WMS source.
 * @return {string|undefined} URL.
 * @api
 */
_ol_source_ImageWMS_.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Set the image load function of the source.
 * @param {ol.ImageLoadFunctionType} imageLoadFunction Image load function.
 * @api
 */
_ol_source_ImageWMS_.prototype.setImageLoadFunction = function(
    imageLoadFunction) {
  this.image_ = null;
  this.imageLoadFunction_ = imageLoadFunction;
  this.changed();
};


/**
 * Set the URL to use for requests.
 * @param {string|undefined} url URL.
 * @api
 */
_ol_source_ImageWMS_.prototype.setUrl = function(url) {
  if (url != this.url_) {
    this.url_ = url;
    this.image_ = null;
    this.changed();
  }
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 * @api
 */
_ol_source_ImageWMS_.prototype.updateParams = function(params) {
  _ol_obj_.assign(this.params_, params);
  this.updateV13_();
  this.image_ = null;
  this.changed();
};


/**
 * @private
 */
_ol_source_ImageWMS_.prototype.updateV13_ = function() {
  var version = this.params_['VERSION'] || _ol_.DEFAULT_WMS_VERSION;
  this.v13_ = _ol_string_.compareVersions(version, '1.3') >= 0;
};
export default _ol_source_ImageWMS_;
