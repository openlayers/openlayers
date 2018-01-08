/**
 * @module ol/source/TileWMS
 */

import {DEFAULT_WMS_VERSION} from './common.js';
import {inherits} from '../index.js';
import {assert} from '../asserts.js';
import {buffer, createEmpty} from '../extent.js';
import _ol_obj_ from '../obj.js';
import {modulo} from '../math.js';
import {get as getProjection, transform, transformExtent} from '../proj.js';
import _ol_reproj_ from '../reproj.js';
import _ol_size_ from '../size.js';
import TileImage from '../source/TileImage.js';
import WMSServerType from '../source/WMSServerType.js';
import _ol_tilecoord_ from '../tilecoord.js';
import _ol_string_ from '../string.js';
import _ol_uri_ from '../uri.js';

/**
 * @classdesc
 * Layer source for tile data from WMS servers.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.TileWMSOptions=} opt_options Tile WMS options.
 * @api
 */
var _ol_source_TileWMS_ = function(opt_options) {

  var options = opt_options || {};

  var params = options.params || {};

  var transparent = 'TRANSPARENT' in params ? params['TRANSPARENT'] : true;

  TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    opaque: !transparent,
    projection: options.projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileClass: options.tileClass,
    tileGrid: options.tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    url: options.url,
    urls: options.urls,
    wrapX: options.wrapX !== undefined ? options.wrapX : true,
    transition: options.transition
  });

  /**
   * @private
   * @type {number}
   */
  this.gutter_ = options.gutter !== undefined ? options.gutter : 0;

  /**
   * @private
   * @type {!Object}
   */
  this.params_ = params;

  /**
   * @private
   * @type {boolean}
   */
  this.v13_ = true;

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
   * @type {ol.Extent}
   */
  this.tmpExtent_ = createEmpty();

  this.updateV13_();
  this.setKey(this.getKeyForParams_());

};

inherits(_ol_source_TileWMS_, TileImage);


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
_ol_source_TileWMS_.prototype.getGetFeatureInfoUrl = function(coordinate, resolution, projection, params) {
  var projectionObj = getProjection(projection);
  var sourceProjectionObj = this.getProjection();

  var tileGrid = this.getTileGrid();
  if (!tileGrid) {
    tileGrid = this.getTileGridForProjection(projectionObj);
  }

  var tileCoord = tileGrid.getTileCoordForCoordAndResolution(coordinate, resolution);

  if (tileGrid.getResolutions().length <= tileCoord[0]) {
    return undefined;
  }

  var tileResolution = tileGrid.getResolution(tileCoord[0]);
  var tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent_);
  var tileSize = _ol_size_.toSize(tileGrid.getTileSize(tileCoord[0]), this.tmpSize);


  var gutter = this.gutter_;
  if (gutter !== 0) {
    tileSize = _ol_size_.buffer(tileSize, gutter, this.tmpSize);
    tileExtent = buffer(tileExtent, tileResolution * gutter, tileExtent);
  }

  if (sourceProjectionObj && sourceProjectionObj !== projectionObj) {
    tileResolution = _ol_reproj_.calculateSourceResolution(sourceProjectionObj, projectionObj, coordinate, tileResolution);
    tileExtent = transformExtent(tileExtent, projectionObj, sourceProjectionObj);
    coordinate = transform(coordinate, projectionObj, sourceProjectionObj);
  }

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': DEFAULT_WMS_VERSION,
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': this.params_['LAYERS']
  };
  _ol_obj_.assign(baseParams, this.params_, params);

  var x = Math.floor((coordinate[0] - tileExtent[0]) / tileResolution);
  var y = Math.floor((tileExtent[3] - coordinate[1]) / tileResolution);

  baseParams[this.v13_ ? 'I' : 'X'] = x;
  baseParams[this.v13_ ? 'J' : 'Y'] = y;

  return this.getRequestUrl_(tileCoord, tileSize, tileExtent,
      1, sourceProjectionObj || projectionObj, baseParams);
};


/**
 * @inheritDoc
 */
_ol_source_TileWMS_.prototype.getGutterInternal = function() {
  return this.gutter_;
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 * @api
 */
_ol_source_TileWMS_.prototype.getParams = function() {
  return this.params_;
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Size} tileSize Tile size.
 * @param {ol.Extent} tileExtent Tile extent.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @param {Object} params Params.
 * @return {string|undefined} Request URL.
 * @private
 */
_ol_source_TileWMS_.prototype.getRequestUrl_ = function(tileCoord, tileSize, tileExtent,
    pixelRatio, projection, params) {

  var urls = this.urls;
  if (!urls) {
    return undefined;
  }

  params['WIDTH'] = tileSize[0];
  params['HEIGHT'] = tileSize[1];

  params[this.v13_ ? 'CRS' : 'SRS'] = projection.getCode();

  if (!('STYLES' in this.params_)) {
    params['STYLES'] = '';
  }

  if (pixelRatio != 1) {
    switch (this.serverType_) {
      case WMSServerType.GEOSERVER:
        var dpi = (90 * pixelRatio + 0.5) | 0;
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
        assert(false, 52); // Unknown `serverType` configured
        break;
    }
  }

  var axisOrientation = projection.getAxisOrientation();
  var bbox = tileExtent;
  if (this.v13_ && axisOrientation.substr(0, 2) == 'ne') {
    var tmp;
    tmp = tileExtent[0];
    bbox[0] = tileExtent[1];
    bbox[1] = tmp;
    tmp = tileExtent[2];
    bbox[2] = tileExtent[3];
    bbox[3] = tmp;
  }
  params['BBOX'] = bbox.join(',');

  var url;
  if (urls.length == 1) {
    url = urls[0];
  } else {
    var index = modulo(_ol_tilecoord_.hash(tileCoord), urls.length);
    url = urls[index];
  }
  return _ol_uri_.appendParams(url, params);
};


/**
 * @inheritDoc
 */
_ol_source_TileWMS_.prototype.getTilePixelRatio = function(pixelRatio) {
  return (!this.hidpi_ || this.serverType_ === undefined) ? 1 :
  /** @type {number} */ (pixelRatio);
};


/**
 * @private
 * @return {string} The key for the current params.
 */
_ol_source_TileWMS_.prototype.getKeyForParams_ = function() {
  var i = 0;
  var res = [];
  for (var key in this.params_) {
    res[i++] = key + '-' + this.params_[key];
  }
  return res.join('/');
};


/**
 * @inheritDoc
 */
_ol_source_TileWMS_.prototype.fixedTileUrlFunction = function(tileCoord, pixelRatio, projection) {

  var tileGrid = this.getTileGrid();
  if (!tileGrid) {
    tileGrid = this.getTileGridForProjection(projection);
  }

  if (tileGrid.getResolutions().length <= tileCoord[0]) {
    return undefined;
  }

  if (pixelRatio != 1 && (!this.hidpi_ || this.serverType_ === undefined)) {
    pixelRatio = 1;
  }

  var tileResolution = tileGrid.getResolution(tileCoord[0]);
  var tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent_);
  var tileSize = _ol_size_.toSize(
      tileGrid.getTileSize(tileCoord[0]), this.tmpSize);

  var gutter = this.gutter_;
  if (gutter !== 0) {
    tileSize = _ol_size_.buffer(tileSize, gutter, this.tmpSize);
    tileExtent = buffer(tileExtent, tileResolution * gutter, tileExtent);
  }

  if (pixelRatio != 1) {
    tileSize = _ol_size_.scale(tileSize, pixelRatio, this.tmpSize);
  }

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': DEFAULT_WMS_VERSION,
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  _ol_obj_.assign(baseParams, this.params_);

  return this.getRequestUrl_(tileCoord, tileSize, tileExtent,
      pixelRatio, projection, baseParams);
};

/**
 * Update the user-provided params.
 * @param {Object} params Params.
 * @api
 */
_ol_source_TileWMS_.prototype.updateParams = function(params) {
  _ol_obj_.assign(this.params_, params);
  this.updateV13_();
  this.setKey(this.getKeyForParams_());
};


/**
 * @private
 */
_ol_source_TileWMS_.prototype.updateV13_ = function() {
  var version = this.params_['VERSION'] || DEFAULT_WMS_VERSION;
  this.v13_ = _ol_string_.compareVersions(version, '1.3') >= 0;
};
export default _ol_source_TileWMS_;
