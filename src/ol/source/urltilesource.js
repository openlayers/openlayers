goog.provide('ol.source.UrlTile');

goog.require('goog.events');
goog.require('ol.TileLoadFunctionType');
goog.require('ol.TileState');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.proj');
goog.require('ol.source.Tile');
goog.require('ol.source.TileEvent');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            opaque: (boolean|undefined),
 *            projection: ol.proj.ProjectionLike,
 *            state: (ol.source.State|string|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileLoadFunction: ol.TileLoadFunctionType,
 *            tilePixelRatio: (number|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined),
 *            wrapX: (boolean|undefined)}}
 */
ol.source.UrlTileOptions;



/**
 * @classdesc
 * Base class for sources providing tiles divided into a tile grid over http.
 *
 * @constructor
 * @fires ol.source.TileEvent
 * @extends {ol.source.Tile}
 * @param {ol.source.UrlTileOptions} options Image tile options.
 */
ol.source.UrlTile = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    extent: options.extent,
    logo: options.logo,
    opaque: options.opaque,
    projection: options.projection,
    state: options.state ?
        /** @type {ol.source.State} */ (options.state) : undefined,
    tileGrid: options.tileGrid,
    tilePixelRatio: options.tilePixelRatio,
    wrapX: options.wrapX
  });

  /**
   * @protected
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction = options.tileLoadFunction;

  /**
   * @protected
   * @type {ol.TileUrlFunctionType}
   */
  this.tileUrlFunction = options.tileUrlFunction ?
      options.tileUrlFunction :
      ol.TileUrlFunction.nullTileUrlFunction;

  /**
   * @protected
   * @type {!Array.<string>|null}
   */
  this.urls = null;

  if (options.urls) {
    if (options.tileUrlFunction) {
      this.urls = options.urls;
    } else {
      this.setUrls(options.urls);
    }
  } else if (options.url) {
    this.setUrl(options.url);
  }
  if (options.tileUrlFunction) {
    this.setTileUrlFunction(options.tileUrlFunction);
  }

};
goog.inherits(ol.source.UrlTile, ol.source.Tile);


/**
 * Return the tile load function of the source.
 * @return {ol.TileLoadFunctionType} TileLoadFunction
 * @api
 */
ol.source.UrlTile.prototype.getTileLoadFunction = function() {
  return this.tileLoadFunction;
};


/**
 * Return the tile URL function of the source.
 * @return {ol.TileUrlFunctionType} TileUrlFunction
 * @api
 */
ol.source.UrlTile.prototype.getTileUrlFunction = function() {
  return this.tileUrlFunction;
};


/**
 * Return the URLs used for this source.
 * When a tileUrlFunction is used instead of url or urls,
 * null will be returned.
 * @return {!Array.<string>|null} URLs.
 * @api
 */
ol.source.UrlTile.prototype.getUrls = function() {
  return this.urls;
};


/**
 * Handle tile change events.
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.source.UrlTile.prototype.handleTileChange = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  switch (tile.getState()) {
    case ol.TileState.LOADING:
      this.dispatchEvent(
          new ol.source.TileEvent(ol.source.TileEventType.TILELOADSTART, tile));
      break;
    case ol.TileState.LOADED:
      this.dispatchEvent(
          new ol.source.TileEvent(ol.source.TileEventType.TILELOADEND, tile));
      break;
    case ol.TileState.ERROR:
      this.dispatchEvent(
          new ol.source.TileEvent(ol.source.TileEventType.TILELOADERROR, tile));
      break;
  }
};


/**
 * Set the tile load function of the source.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @api
 */
ol.source.UrlTile.prototype.setTileLoadFunction = function(tileLoadFunction) {
  this.tileCache.clear();
  this.tileLoadFunction = tileLoadFunction;
  this.changed();
};


/**
 * Set the tile URL function of the source.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @api
 */
ol.source.UrlTile.prototype.setTileUrlFunction = function(tileUrlFunction) {
  // FIXME It should be possible to be more intelligent and avoid clearing the
  // FIXME cache.  The tile URL function would need to be incorporated into the
  // FIXME cache key somehow.
  this.tileCache.clear();
  this.tileUrlFunction = tileUrlFunction;
  this.changed();
};


/**
 * Set the URL to use for requests.
 * @param {string} url URL.
 * @api stable
 */
ol.source.UrlTile.prototype.setUrl = function(url) {
  this.setTileUrlFunction(ol.TileUrlFunction.createFromTemplates(
      ol.TileUrlFunction.expandUrl(url), this.tileGrid));
  this.urls = [url];
};


/**
 * Set the URLs to use for requests.
 * @param {Array.<string>} urls URLs.
 * @api stable
 */
ol.source.UrlTile.prototype.setUrls = function(urls) {
  this.setTileUrlFunction(ol.TileUrlFunction.createFromTemplates(
      urls, this.tileGrid));
  this.urls = urls;
};


/**
 * @inheritDoc
 */
ol.source.UrlTile.prototype.useTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    this.tileCache.get(tileCoordKey);
  }
};
