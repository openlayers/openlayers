/**
 * @module ol/source/TileArcGISRest
 */
import {inherits} from '../index.js';
import {createEmpty} from '../extent.js';
import {modulo} from '../math.js';
import {assign} from '../obj.js';
import _ol_size_ from '../size.js';
import TileImage from '../source/TileImage.js';
import _ol_tilecoord_ from '../tilecoord.js';
import {appendParams} from '../uri.js';

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
const TileArcGISRest = function(opt_options) {

  const options = opt_options || {};

  TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
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
  this.tmpExtent_ = createEmpty();

  this.setKey(this.getKeyForParams_());
};

inherits(TileArcGISRest, TileImage);


/**
 * @private
 * @return {string} The key for the current params.
 */
TileArcGISRest.prototype.getKeyForParams_ = function() {
  let i = 0;
  const res = [];
  for (const key in this.params_) {
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
TileArcGISRest.prototype.getParams = function() {
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
TileArcGISRest.prototype.getRequestUrl_ = function(tileCoord, tileSize, tileExtent,
  pixelRatio, projection, params) {

  const urls = this.urls;
  if (!urls) {
    return undefined;
  }

  // ArcGIS Server only wants the numeric portion of the projection ID.
  const srid = projection.getCode().split(':').pop();

  params['SIZE'] = tileSize[0] + ',' + tileSize[1];
  params['BBOX'] = tileExtent.join(',');
  params['BBOXSR'] = srid;
  params['IMAGESR'] = srid;
  params['DPI'] = Math.round(
    params['DPI'] ? params['DPI'] * pixelRatio : 90 * pixelRatio
  );

  let url;
  if (urls.length == 1) {
    url = urls[0];
  } else {
    const index = modulo(_ol_tilecoord_.hash(tileCoord), urls.length);
    url = urls[index];
  }

  const modifiedUrl = url
    .replace(/MapServer\/?$/, 'MapServer/export')
    .replace(/ImageServer\/?$/, 'ImageServer/exportImage');
  return appendParams(modifiedUrl, params);
};


/**
 * @inheritDoc
 */
TileArcGISRest.prototype.getTilePixelRatio = function(pixelRatio) {
  return /** @type {number} */ (pixelRatio);
};


/**
 * @inheritDoc
 */
TileArcGISRest.prototype.fixedTileUrlFunction = function(tileCoord, pixelRatio, projection) {

  let tileGrid = this.getTileGrid();
  if (!tileGrid) {
    tileGrid = this.getTileGridForProjection(projection);
  }

  if (tileGrid.getResolutions().length <= tileCoord[0]) {
    return undefined;
  }

  const tileExtent = tileGrid.getTileCoordExtent(
    tileCoord, this.tmpExtent_);
  let tileSize = _ol_size_.toSize(
    tileGrid.getTileSize(tileCoord[0]), this.tmpSize);

  if (pixelRatio != 1) {
    tileSize = _ol_size_.scale(tileSize, pixelRatio, this.tmpSize);
  }

  // Apply default params and override with user specified values.
  const baseParams = {
    'F': 'image',
    'FORMAT': 'PNG32',
    'TRANSPARENT': true
  };
  assign(baseParams, this.params_);

  return this.getRequestUrl_(tileCoord, tileSize, tileExtent,
    pixelRatio, projection, baseParams);
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 * @api
 */
TileArcGISRest.prototype.updateParams = function(params) {
  assign(this.params_, params);
  this.setKey(this.getKeyForParams_());
};
export default TileArcGISRest;
