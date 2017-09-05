import _ol_ from '../index';
import _ol_TileState_ from '../tilestate';
import _ol_TileUrlFunction_ from '../tileurlfunction';
import _ol_source_Tile_ from '../source/tile';
import _ol_source_TileEventType_ from '../source/tileeventtype';

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

  _ol_source_Tile_.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    extent: options.extent,
    logo: options.logo,
    opaque: options.opaque,
    projection: options.projection,
    state: options.state,
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
  this.tileUrlFunction = this.fixedTileUrlFunction ?
    this.fixedTileUrlFunction.bind(this) :
    _ol_TileUrlFunction_.nullTileUrlFunction;

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

};

_ol_.inherits(_ol_source_UrlTile_, _ol_source_Tile_);


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
  switch (tile.getState()) {
    case _ol_TileState_.LOADING:
      this.dispatchEvent(
          new _ol_source_Tile_.Event(_ol_source_TileEventType_.TILELOADSTART, tile));
      break;
    case _ol_TileState_.LOADED:
      this.dispatchEvent(
          new _ol_source_Tile_.Event(_ol_source_TileEventType_.TILELOADEND, tile));
      break;
    case _ol_TileState_.ERROR:
      this.dispatchEvent(
          new _ol_source_Tile_.Event(_ol_source_TileEventType_.TILELOADERROR, tile));
      break;
    default:
      // pass
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
  var urls = this.urls = _ol_TileUrlFunction_.expandUrl(url);
  this.setTileUrlFunction(this.fixedTileUrlFunction ?
    this.fixedTileUrlFunction.bind(this) :
    _ol_TileUrlFunction_.createFromTemplates(urls, this.tileGrid), url);
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
    _ol_TileUrlFunction_.createFromTemplates(urls, this.tileGrid), key);
};


/**
 * @inheritDoc
 */
_ol_source_UrlTile_.prototype.useTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    this.tileCache.get(tileCoordKey);
  }
};
export default _ol_source_UrlTile_;
