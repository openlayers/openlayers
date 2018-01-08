/**
 * @module ol/source/UrlTile
 */
import {getUid, inherits} from '../index.js';
import TileState from '../TileState.js';
import {expandUrl, createFromTemplates, nullTileUrlFunction} from '../tileurlfunction.js';
import TileSource from '../source/Tile.js';
import TileEventType from '../source/TileEventType.js';
import _ol_tilecoord_ from '../tilecoord.js';

/**
 * @classdesc
 * Base class for sources providing tiles divided into a tile grid over http.
 *
 * @constructor
 * @abstract
 * @fires ol.source.Tile.Event
 * @extends {ol.source.Tile}
 * @param {ol.SourceUrlTileOptions} options Image tile options.
 */
var _ol_source_UrlTile_ = function(options) {

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
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction = options.tileLoadFunction;

  /**
   * @protected
   * @type {ol.TileUrlFunctionType}
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
   * @type {Object.<number, boolean>}
   */
  this.tileLoadingKeys_ = {};

};

inherits(_ol_source_UrlTile_, TileSource);


/**
 * @type {ol.TileUrlFunctionType|undefined}
 * @protected
 */
_ol_source_UrlTile_.prototype.fixedTileUrlFunction;

/**
 * Return the tile load function of the source.
 * @return {ol.TileLoadFunctionType} TileLoadFunction
 * @api
 */
_ol_source_UrlTile_.prototype.getTileLoadFunction = function() {
  return this.tileLoadFunction;
};


/**
 * Return the tile URL function of the source.
 * @return {ol.TileUrlFunctionType} TileUrlFunction
 * @api
 */
_ol_source_UrlTile_.prototype.getTileUrlFunction = function() {
  return this.tileUrlFunction;
};


/**
 * Return the URLs used for this source.
 * When a tileUrlFunction is used instead of url or urls,
 * null will be returned.
 * @return {!Array.<string>|null} URLs.
 * @api
 */
_ol_source_UrlTile_.prototype.getUrls = function() {
  return this.urls;
};


/**
 * Handle tile change events.
 * @param {ol.events.Event} event Event.
 * @protected
 */
_ol_source_UrlTile_.prototype.handleTileChange = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  var uid = getUid(tile);
  var tileState = tile.getState();
  var type;
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
    this.dispatchEvent(new TileSource.Event(type, tile));
  }
};


/**
 * Set the tile load function of the source.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @api
 */
_ol_source_UrlTile_.prototype.setTileLoadFunction = function(tileLoadFunction) {
  this.tileCache.clear();
  this.tileLoadFunction = tileLoadFunction;
  this.changed();
};


/**
 * Set the tile URL function of the source.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @param {string=} opt_key Optional new tile key for the source.
 * @api
 */
_ol_source_UrlTile_.prototype.setTileUrlFunction = function(tileUrlFunction, opt_key) {
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
_ol_source_UrlTile_.prototype.setUrl = function(url) {
  var urls = this.urls = expandUrl(url);
  this.setTileUrlFunction(this.fixedTileUrlFunction ?
    this.fixedTileUrlFunction.bind(this) :
    createFromTemplates(urls, this.tileGrid), url);
};


/**
 * Set the URLs to use for requests.
 * @param {Array.<string>} urls URLs.
 * @api
 */
_ol_source_UrlTile_.prototype.setUrls = function(urls) {
  this.urls = urls;
  var key = urls.join('\n');
  this.setTileUrlFunction(this.fixedTileUrlFunction ?
    this.fixedTileUrlFunction.bind(this) :
    createFromTemplates(urls, this.tileGrid), key);
};


/**
 * @inheritDoc
 */
_ol_source_UrlTile_.prototype.useTile = function(z, x, y) {
  var tileCoordKey = _ol_tilecoord_.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    this.tileCache.get(tileCoordKey);
  }
};
export default _ol_source_UrlTile_;
