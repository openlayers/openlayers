// FIXME add minZoom support
// FIXME add date line wrap (tile coord transform)
// FIXME cannot be shared between maps with different projections

goog.provide('ol.source.TileWMS');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.math');
goog.require('ol.proj');
goog.require('ol.size');
goog.require('ol.source.TileImage');
goog.require('ol.source.WMSServerType');
goog.require('ol.tilecoord');
goog.require('ol.string');
goog.require('ol.uri');

/**
 * @classdesc
 * Layer source for tile data from WMS servers.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.TileWMSOptions=} opt_options Tile WMS options.
 * @api stable
 */
ol.source.TileWMS = function(opt_options) {

  var options = opt_options || {};

  var params = options.params || {};

  var transparent = 'TRANSPARENT' in params ? params['TRANSPARENT'] : true;

  ol.source.TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    opaque: !transparent,
    projection: options.projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileGrid: options.tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    url: options.url,
    urls: options.urls,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
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
  this.serverType_ =
      /** @type {ol.source.WMSServerType|undefined} */ (options.serverType);

  /**
   * @private
   * @type {boolean}
   */
  this.hidpi_ = options.hidpi !== undefined ? options.hidpi : true;

  /**
   * @private
   * @type {string}
   */
  this.coordKeyPrefix_ = '';
  this.resetCoordKeyPrefix_();

  /**
   * @private
   * @type {ol.Extent}
   */
  this.tmpExtent_ = ol.extent.createEmpty();

  this.updateV13_();
  this.setKey(this.getKeyForParams_());

};
ol.inherits(ol.source.TileWMS, ol.source.TileImage);


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
 * @api stable
 */
ol.source.TileWMS.prototype.getGetFeatureInfoUrl = function(coordinate, resolution, projection, params) {

  ol.DEBUG && console.assert(!('VERSION' in params),
      'key VERSION is not allowed in params');

  var projectionObj = ol.proj.get(projection);

  var tileGrid = this.getTileGrid();
  if (!tileGrid) {
    tileGrid = this.getTileGridForProjection(projectionObj);
  }

  var tileCoord = tileGrid.getTileCoordForCoordAndResolution(
      coordinate, resolution);

  if (tileGrid.getResolutions().length <= tileCoord[0]) {
    return undefined;
  }

  var tileResolution = tileGrid.getResolution(tileCoord[0]);
  var tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent_);
  var tileSize = ol.size.toSize(
      tileGrid.getTileSize(tileCoord[0]), this.tmpSize);

  var gutter = this.gutter_;
  if (gutter !== 0) {
    tileSize = ol.size.buffer(tileSize, gutter, this.tmpSize);
    tileExtent = ol.extent.buffer(tileExtent,
        tileResolution * gutter, tileExtent);
  }

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': ol.DEFAULT_WMS_VERSION,
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': this.params_['LAYERS']
  };
  ol.obj.assign(baseParams, this.params_, params);

  var x = Math.floor((coordinate[0] - tileExtent[0]) / tileResolution);
  var y = Math.floor((tileExtent[3] - coordinate[1]) / tileResolution);

  baseParams[this.v13_ ? 'I' : 'X'] = x;
  baseParams[this.v13_ ? 'J' : 'Y'] = y;

  return this.getRequestUrl_(tileCoord, tileSize, tileExtent,
      1, projectionObj, baseParams);
};


/**
 * @inheritDoc
 */
ol.source.TileWMS.prototype.getGutterInternal = function() {
  return this.gutter_;
};


/**
 * @inheritDoc
 */
ol.source.TileWMS.prototype.getKeyZXY = function(z, x, y) {
  return this.coordKeyPrefix_ + ol.source.TileImage.prototype.getKeyZXY.call(this, z, x, y);
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 * @api stable
 */
ol.source.TileWMS.prototype.getParams = function() {
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
ol.source.TileWMS.prototype.getRequestUrl_ = function(tileCoord, tileSize, tileExtent,
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
      case ol.source.WMSServerType.GEOSERVER:
        var dpi = (90 * pixelRatio + 0.5) | 0;
        if ('FORMAT_OPTIONS' in params) {
          params['FORMAT_OPTIONS'] += ';dpi:' + dpi;
        } else {
          params['FORMAT_OPTIONS'] = 'dpi:' + dpi;
        }
        break;
      case ol.source.WMSServerType.MAPSERVER:
        params['MAP_RESOLUTION'] = 90 * pixelRatio;
        break;
      case ol.source.WMSServerType.CARMENTA_SERVER:
      case ol.source.WMSServerType.QGIS:
        params['DPI'] = 90 * pixelRatio;
        break;
      default:
        ol.asserts.assert(false, 52); // Unknown `serverType` configured
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
    var index = ol.math.modulo(ol.tilecoord.hash(tileCoord), urls.length);
    url = urls[index];
  }
  return ol.uri.appendParams(url, params);
};


/**
 * @inheritDoc
 */
ol.source.TileWMS.prototype.getTilePixelRatio = function(pixelRatio) {
  return (!this.hidpi_ || this.serverType_ === undefined) ? 1 :
      /** @type {number} */ (pixelRatio);
};


/**
 * @private
 */
ol.source.TileWMS.prototype.resetCoordKeyPrefix_ = function() {
  var i = 0;
  var res = [];

  if (this.urls) {
    var j, jj;
    for (j = 0, jj = this.urls.length; j < jj; ++j) {
      res[i++] = this.urls[j];
    }
  }

  this.coordKeyPrefix_ = res.join('#');
};


/**
 * @private
 * @return {string} The key for the current params.
 */
ol.source.TileWMS.prototype.getKeyForParams_ = function() {
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
ol.source.TileWMS.prototype.fixedTileUrlFunction = function(tileCoord, pixelRatio, projection) {

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
  var tileSize = ol.size.toSize(
      tileGrid.getTileSize(tileCoord[0]), this.tmpSize);

  var gutter = this.gutter_;
  if (gutter !== 0) {
    tileSize = ol.size.buffer(tileSize, gutter, this.tmpSize);
    tileExtent = ol.extent.buffer(tileExtent,
        tileResolution * gutter, tileExtent);
  }

  if (pixelRatio != 1) {
    tileSize = ol.size.scale(tileSize, pixelRatio, this.tmpSize);
  }

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': ol.DEFAULT_WMS_VERSION,
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  ol.obj.assign(baseParams, this.params_);

  return this.getRequestUrl_(tileCoord, tileSize, tileExtent,
      pixelRatio, projection, baseParams);
};

/**
 * @inheritDoc
 */
ol.source.TileWMS.prototype.setUrls = function(urls) {
  ol.source.TileImage.prototype.setUrls.call(this, urls);
  this.resetCoordKeyPrefix_();
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 * @api stable
 */
ol.source.TileWMS.prototype.updateParams = function(params) {
  ol.obj.assign(this.params_, params);
  this.resetCoordKeyPrefix_();
  this.updateV13_();
  this.setKey(this.getKeyForParams_());
};


/**
 * @private
 */
ol.source.TileWMS.prototype.updateV13_ = function() {
  var version = this.params_['VERSION'] || ol.DEFAULT_WMS_VERSION;
  this.v13_ = ol.string.compareVersions(version, '1.3') >= 0;
};
