goog.provide('ol.source.TileArcGISRest');

goog.require('ol');
goog.require('ol.extent');
goog.require('ol.math');
goog.require('ol.obj');
goog.require('ol.size');
goog.require('ol.source.TileImage');
goog.require('ol.tilecoord');
goog.require('ol.uri');


/**
 * @classdesc
 * Layer source for tile data from ArcGIS Rest services. Map and Image
 * Services are supported.
 *
 * For cached ArcGIS services, better performance is available using the
 * {@link ol.source.XYZ} data source.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.TileArcGISRestOptions=} opt_options Tile ArcGIS Rest
 *     options.
 * @api
 */
ol.source.TileArcGISRest = function(opt_options) {

  var options = opt_options || {};

  ol.source.TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: options.projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileGrid: options.tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    url: options.url,
    urls: options.urls,
    wrapX: options.wrapX !== undefined ? options.wrapX : true,
    transition: options.transition
  });

  /**
   * @private
   * @type {!Object}
   */
  this.params_ = options.params || {};

  /**
   * @private
   * @type {ol.Extent}
   */
  this.tmpExtent_ = ol.extent.createEmpty();

  this.setKey(this.getKeyForParams_());
};
ol.inherits(ol.source.TileArcGISRest, ol.source.TileImage);


/**
 * @private
 * @return {string} The key for the current params.
 */
ol.source.TileArcGISRest.prototype.getKeyForParams_ = function() {
  var i = 0;
  var res = [];
  for (var key in this.params_) {
    res[i++] = key + '-' + this.params_[key];
  }
  return res.join('/');
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 * @api
 */
ol.source.TileArcGISRest.prototype.getParams = function() {
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
ol.source.TileArcGISRest.prototype.getRequestUrl_ = function(tileCoord, tileSize, tileExtent,
    pixelRatio, projection, params) {

  var urls = this.urls;
  if (!urls) {
    return undefined;
  }

  // ArcGIS Server only wants the numeric portion of the projection ID.
  var srid = projection.getCode().split(':').pop();

  params['SIZE'] = tileSize[0] + ',' + tileSize[1];
  params['BBOX'] = tileExtent.join(',');
  params['BBOXSR'] = srid;
  params['IMAGESR'] = srid;
  params['DPI'] = Math.round(
      params['DPI'] ? params['DPI'] * pixelRatio : 90 * pixelRatio
  );

  var url;
  if (urls.length == 1) {
    url = urls[0];
  } else {
    var index = ol.math.modulo(ol.tilecoord.hash(tileCoord), urls.length);
    url = urls[index];
  }

  var modifiedUrl = url
      .replace(/MapServer\/?$/, 'MapServer/export')
      .replace(/ImageServer\/?$/, 'ImageServer/exportImage');
  return ol.uri.appendParams(modifiedUrl, params);
};


/**
 * @inheritDoc
 */
ol.source.TileArcGISRest.prototype.getTilePixelRatio = function(pixelRatio) {
  return /** @type {number} */ (pixelRatio);
};


/**
 * @inheritDoc
 */
ol.source.TileArcGISRest.prototype.fixedTileUrlFunction = function(tileCoord, pixelRatio, projection) {

  var tileGrid = this.getTileGrid();
  if (!tileGrid) {
    tileGrid = this.getTileGridForProjection(projection);
  }

  if (tileGrid.getResolutions().length <= tileCoord[0]) {
    return undefined;
  }

  var tileExtent = tileGrid.getTileCoordExtent(
      tileCoord, this.tmpExtent_);
  var tileSize = ol.size.toSize(
      tileGrid.getTileSize(tileCoord[0]), this.tmpSize);

  if (pixelRatio != 1) {
    tileSize = ol.size.scale(tileSize, pixelRatio, this.tmpSize);
  }

  // Apply default params and override with user specified values.
  var baseParams = {
    'F': 'image',
    'FORMAT': 'PNG32',
    'TRANSPARENT': true
  };
  ol.obj.assign(baseParams, this.params_);

  return this.getRequestUrl_(tileCoord, tileSize, tileExtent,
      pixelRatio, projection, baseParams);
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 * @api
 */
ol.source.TileArcGISRest.prototype.updateParams = function(params) {
  ol.obj.assign(this.params_, params);
  this.setKey(this.getKeyForParams_());
};
