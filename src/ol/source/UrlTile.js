/**
 * @module ol/source/UrlTile
 */
import {getUid, inherits} from '../util.js';
import TileState from '../TileState.js';
import {expandUrl, createFromTemplates, nullTileUrlFunction} from '../tileurlfunction.js';
import TileSource, {TileSourceEvent} from '../source/Tile.js';
import TileEventType from '../source/TileEventType.js';
import {getKeyZXY} from '../tilecoord.js';

/**
 * @typedef {Object} Options
 * @property {module:ol/source/Source~AttributionLike} [attributions]
 * @property {number} [cacheSize]
 * @property {module:ol/extent~Extent} [extent]
 * @property {boolean} [opaque]
 * @property {module:ol/proj~ProjectionLike} [projection]
 * @property {module:ol/source/State} [state]
 * @property {module:ol/tilegrid/TileGrid} [tileGrid]
 * @property {module:ol/Tile~LoadFunction} tileLoadFunction
 * @property {number} [tilePixelRatio]
 * @property {module:ol/Tile~UrlFunction} [tileUrlFunction]
 * @property {string} [url]
 * @property {Array.<string>} [urls]
 * @property {boolean} [wrapX=true]
 * @property {number} [transition]
 */


/**
 * @classdesc
 * Base class for sources providing tiles divided into a tile grid over http.
 *
 * @constructor
 * @abstract
 * @fires module:ol/source/TileEvent
 * @extends {module:ol/source/Tile}
 * @param {module:ol/source/UrlTile~Options=} options Image tile options.
 */
const UrlTile = function(options) {

  TileSource.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    extent: options.extent,
    opaque: options.opaque,
    projection: options.projection,
    state: options.state,
    tileGrid: options.tileGrid,
    tilePixelRatio: options.tilePixelRatio,
    wrapX: options.wrapX,
    transition: options.transition
  });

  /**
   * @protected
   * @type {module:ol/Tile~LoadFunction}
   */
  this.tileLoadFunction = options.tileLoadFunction;

  /**
   * @protected
   * @type {module:ol/Tile~UrlFunction}
   */
  this.tileUrlFunction = this.fixedTileUrlFunction ?
    this.fixedTileUrlFunction.bind(this) : nullTileUrlFunction;

  /**
   * @protected
   * @type {!Array.<string>|null}
   */
  this.urls = null;

  if (options.urls) {
    this.setUrls(options.urls);
  } else if (options.url) {
    this.setUrl(options.url);
  }
  if (options.tileUrlFunction) {
    this.setTileUrlFunction(options.tileUrlFunction);
  }

  /**
   * @private
   * @type {!Object.<number, boolean>}
   */
  this.tileLoadingKeys_ = {};

};

inherits(UrlTile, TileSource);


/**
 * @type {module:ol/Tile~UrlFunction|undefined}
 * @protected
 */
UrlTile.prototype.fixedTileUrlFunction;

/**
 * Return the tile load function of the source.
 * @return {module:ol/Tile~LoadFunction} TileLoadFunction
 * @api
 */
UrlTile.prototype.getTileLoadFunction = function() {
  return this.tileLoadFunction;
};


/**
 * Return the tile URL function of the source.
 * @return {module:ol/Tile~UrlFunction} TileUrlFunction
 * @api
 */
UrlTile.prototype.getTileUrlFunction = function() {
  return this.tileUrlFunction;
};


/**
 * Return the URLs used for this source.
 * When a tileUrlFunction is used instead of url or urls,
 * null will be returned.
 * @return {!Array.<string>|null} URLs.
 * @api
 */
UrlTile.prototype.getUrls = function() {
  return this.urls;
};


/**
 * Handle tile change events.
 * @param {module:ol/events/Event} event Event.
 * @protected
 */
UrlTile.prototype.handleTileChange = function(event) {
  const tile = /** @type {module:ol/Tile} */ (event.target);
  const uid = getUid(tile);
  const tileState = tile.getState();
  let type;
  if (tileState == TileState.LOADING) {
    this.tileLoadingKeys_[uid] = true;
    type = TileEventType.TILELOADSTART;
  } else if (uid in this.tileLoadingKeys_) {
    delete this.tileLoadingKeys_[uid];
    type = tileState == TileState.ERROR ? TileEventType.TILELOADERROR :
      (tileState == TileState.LOADED || tileState == TileState.ABORT) ?
        TileEventType.TILELOADEND : undefined;
  }
  if (type != undefined) {
    this.dispatchEvent(new TileSourceEvent(type, tile));
  }
};


/**
 * Set the tile load function of the source.
 * @param {module:ol/Tile~LoadFunction} tileLoadFunction Tile load function.
 * @api
 */
UrlTile.prototype.setTileLoadFunction = function(tileLoadFunction) {
  this.tileCache.clear();
  this.tileLoadFunction = tileLoadFunction;
  this.changed();
};


/**
 * Set the tile URL function of the source.
 * @param {module:ol/Tile~UrlFunction} tileUrlFunction Tile URL function.
 * @param {string=} opt_key Optional new tile key for the source.
 * @api
 */
UrlTile.prototype.setTileUrlFunction = function(tileUrlFunction, opt_key) {
  this.tileUrlFunction = tileUrlFunction;
  this.tileCache.pruneExceptNewestZ();
  if (typeof opt_key !== 'undefined') {
    this.setKey(opt_key);
  } else {
    this.changed();
  }
};


/**
 * Set the URL to use for requests.
 * @param {string} url URL.
 * @api
 */
UrlTile.prototype.setUrl = function(url) {
  const urls = this.urls = expandUrl(url);
  this.setTileUrlFunction(this.fixedTileUrlFunction ?
    this.fixedTileUrlFunction.bind(this) :
    createFromTemplates(urls, this.tileGrid), url);
};


/**
 * Set the URLs to use for requests.
 * @param {Array.<string>} urls URLs.
 * @api
 */
UrlTile.prototype.setUrls = function(urls) {
  this.urls = urls;
  const key = urls.join('\n');
  this.setTileUrlFunction(this.fixedTileUrlFunction ?
    this.fixedTileUrlFunction.bind(this) :
    createFromTemplates(urls, this.tileGrid), key);
};


/**
 * @inheritDoc
 */
UrlTile.prototype.useTile = function(z, x, y) {
  const tileCoordKey = getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    this.tileCache.get(tileCoordKey);
  }
};
export default UrlTile;
