/**
 * @module ol/source/ImageWMS
 */

import {DEFAULT_WMS_VERSION} from './common.js';
import {inherits} from '../index.js';
import _ol_Image_ from '../Image.js';
import {assert} from '../asserts.js';
import {listen} from '../events.js';
import EventType from '../events/EventType.js';
import {containsExtent, getCenter, getForViewAndSize, getHeight, getWidth} from '../extent.js';
import {assign} from '../obj.js';
import {get as getProjection, transform} from '../proj.js';
import _ol_reproj_ from '../reproj.js';
import ImageSource from '../source/Image.js';
import WMSServerType from '../source/WMSServerType.js';
import {compareVersions} from '../string.js';
import {appendParams} from '../uri.js';

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
const ImageWMS = function(opt_options) {

  const options = opt_options || {};

  ImageSource.call(this, {
    attributions: options.attributions,
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
    options.imageLoadFunction : ImageSource.defaultImageLoadFunction;

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

inherits(ImageWMS, ImageSource);


/**
 * @const
 * @type {ol.Size}
 * @private
 */
ImageWMS.GETFEATUREINFO_IMAGE_SIZE_ = [101, 101];


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
ImageWMS.prototype.getGetFeatureInfoUrl = function(coordinate, resolution, projection, params) {
  if (this.url_ === undefined) {
    return undefined;
  }
  const projectionObj = getProjection(projection);
  const sourceProjectionObj = this.getProjection();

  if (sourceProjectionObj && sourceProjectionObj !== projectionObj) {
    resolution = _ol_reproj_.calculateSourceResolution(sourceProjectionObj, projectionObj, coordinate, resolution);
    coordinate = transform(coordinate, projectionObj, sourceProjectionObj);
  }

  const extent = getForViewAndSize(coordinate, resolution, 0,
    ImageWMS.GETFEATUREINFO_IMAGE_SIZE_);

  const baseParams = {
    'SERVICE': 'WMS',
    'VERSION': DEFAULT_WMS_VERSION,
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': this.params_['LAYERS']
  };
  assign(baseParams, this.params_, params);

  const x = Math.floor((coordinate[0] - extent[0]) / resolution);
  const y = Math.floor((extent[3] - coordinate[1]) / resolution);
  baseParams[this.v13_ ? 'I' : 'X'] = x;
  baseParams[this.v13_ ? 'J' : 'Y'] = y;

  return this.getRequestUrl_(
    extent, ImageWMS.GETFEATUREINFO_IMAGE_SIZE_,
    1, sourceProjectionObj || projectionObj, baseParams);
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 * @api
 */
ImageWMS.prototype.getParams = function() {
  return this.params_;
};


/**
 * @inheritDoc
 */
ImageWMS.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {

  if (this.url_ === undefined) {
    return null;
  }

  resolution = this.findNearestResolution(resolution);

  if (pixelRatio != 1 && (!this.hidpi_ || this.serverType_ === undefined)) {
    pixelRatio = 1;
  }

  const imageResolution = resolution / pixelRatio;

  const center = getCenter(extent);
  const viewWidth = Math.ceil(getWidth(extent) / imageResolution);
  const viewHeight = Math.ceil(getHeight(extent) / imageResolution);
  const viewExtent = getForViewAndSize(center, imageResolution, 0,
    [viewWidth, viewHeight]);
  const requestWidth = Math.ceil(this.ratio_ * getWidth(extent) / imageResolution);
  const requestHeight = Math.ceil(this.ratio_ * getHeight(extent) / imageResolution);
  const requestExtent = getForViewAndSize(center, imageResolution, 0,
    [requestWidth, requestHeight]);

  const image = this.image_;
  if (image &&
      this.renderedRevision_ == this.getRevision() &&
      image.getResolution() == resolution &&
      image.getPixelRatio() == pixelRatio &&
      containsExtent(image.getExtent(), viewExtent)) {
    return image;
  }

  const params = {
    'SERVICE': 'WMS',
    'VERSION': DEFAULT_WMS_VERSION,
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  assign(params, this.params_);

  this.imageSize_[0] = Math.round(getWidth(requestExtent) / imageResolution);
  this.imageSize_[1] = Math.round(getHeight(requestExtent) / imageResolution);

  const url = this.getRequestUrl_(requestExtent, this.imageSize_, pixelRatio,
    projection, params);

  this.image_ = new _ol_Image_(requestExtent, resolution, pixelRatio,
    url, this.crossOrigin_, this.imageLoadFunction_);

  this.renderedRevision_ = this.getRevision();

  listen(this.image_, EventType.CHANGE,
    this.handleImageChange, this);

  return this.image_;

};


/**
 * Return the image load function of the source.
 * @return {ol.ImageLoadFunctionType} The image load function.
 * @api
 */
ImageWMS.prototype.getImageLoadFunction = function() {
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
ImageWMS.prototype.getRequestUrl_ = function(extent, size, pixelRatio, projection, params) {

  assert(this.url_ !== undefined, 9); // `url` must be configured or set using `#setUrl()`

  params[this.v13_ ? 'CRS' : 'SRS'] = projection.getCode();

  if (!('STYLES' in this.params_)) {
    params['STYLES'] = '';
  }

  if (pixelRatio != 1) {
    switch (this.serverType_) {
      case WMSServerType.GEOSERVER:
        const dpi = (90 * pixelRatio + 0.5) | 0;
        if ('FORMAT_OPTIONS' in params) {
          params['FORMAT_OPTIONS'] += ';dpi:' + dpi;
        } else {
          params['FORMAT_OPTIONS'] = 'dpi:' + dpi;
        }
        break;
      case WMSServerType.MAPSERVER:
        params['MAP_RESOLUTION'] = 90 * pixelRatio;
        break;
      case WMSServerType.CARMENTA_SERVER:
      case WMSServerType.QGIS:
        params['DPI'] = 90 * pixelRatio;
        break;
      default:
        assert(false, 8); // Unknown `serverType` configured
        break;
    }
  }

  params['WIDTH'] = size[0];
  params['HEIGHT'] = size[1];

  const axisOrientation = projection.getAxisOrientation();
  let bbox;
  if (this.v13_ && axisOrientation.substr(0, 2) == 'ne') {
    bbox = [extent[1], extent[0], extent[3], extent[2]];
  } else {
    bbox = extent;
  }
  params['BBOX'] = bbox.join(',');

  return appendParams(/** @type {string} */ (this.url_), params);
};


/**
 * Return the URL used for this WMS source.
 * @return {string|undefined} URL.
 * @api
 */
ImageWMS.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Set the image load function of the source.
 * @param {ol.ImageLoadFunctionType} imageLoadFunction Image load function.
 * @api
 */
ImageWMS.prototype.setImageLoadFunction = function(
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
ImageWMS.prototype.setUrl = function(url) {
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
ImageWMS.prototype.updateParams = function(params) {
  assign(this.params_, params);
  this.updateV13_();
  this.image_ = null;
  this.changed();
};


/**
 * @private
 */
ImageWMS.prototype.updateV13_ = function() {
  const version = this.params_['VERSION'] || DEFAULT_WMS_VERSION;
  this.v13_ = compareVersions(version, '1.3') >= 0;
};
export default ImageWMS;
