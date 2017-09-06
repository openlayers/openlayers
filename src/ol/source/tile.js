import _ol_ from '../index';
import _ol_TileCache_ from '../tilecache';
import _ol_TileState_ from '../tilestate';
import _ol_events_Event_ from '../events/event';
import _ol_proj_ from '../proj';
import _ol_size_ from '../size';
import _ol_source_Source_ from '../source/source';
import _ol_tilecoord_ from '../tilecoord';
import _ol_tilegrid_ from '../tilegrid';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for sources providing images divided into a tile grid.
 *
 * @constructor
 * @abstract
 * @extends {ol.source.Source}
 * @param {ol.SourceTileOptions} options Tile source options.
 * @api
 */
var _ol_source_Tile_ = function(options) {

  _ol_source_Source_.call(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection,
    state: options.state,
    wrapX: options.wrapX
  });

  /**
   * @private
   * @type {boolean}
   */
  this.opaque_ = options.opaque !== undefined ? options.opaque : false;

  /**
   * @private
   * @type {number}
   */
  this.tilePixelRatio_ = options.tilePixelRatio !== undefined ?
    options.tilePixelRatio : 1;

  /**
   * @protected
   * @type {ol.tilegrid.TileGrid}
   */
  this.tileGrid = options.tileGrid !== undefined ? options.tileGrid : null;

  /**
   * @protected
   * @type {ol.TileCache}
   */
  this.tileCache = new _ol_TileCache_(options.cacheSize);

  /**
   * @protected
   * @type {ol.Size}
   */
  this.tmpSize = [0, 0];

  /**
   * @private
   * @type {string}
   */
  this.key_ = '';

};

_ol_.inherits(_ol_source_Tile_, _ol_source_Source_);


/**
 * @return {boolean} Can expire cache.
 */
_ol_source_Tile_.prototype.canExpireCache = function() {
  return this.tileCache.canExpireCache();
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @param {Object.<string, ol.TileRange>} usedTiles Used tiles.
 */
_ol_source_Tile_.prototype.expireCache = function(projection, usedTiles) {
  var tileCache = this.getTileCacheForProjection(projection);
  if (tileCache) {
    tileCache.expireCache(usedTiles);
  }
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @param {number} z Zoom level.
 * @param {ol.TileRange} tileRange Tile range.
 * @param {function(ol.Tile):(boolean|undefined)} callback Called with each
 *     loaded tile.  If the callback returns `false`, the tile will not be
 *     considered loaded.
 * @return {boolean} The tile range is fully covered with loaded tiles.
 */
_ol_source_Tile_.prototype.forEachLoadedTile = function(projection, z, tileRange, callback) {
  var tileCache = this.getTileCacheForProjection(projection);
  if (!tileCache) {
    return false;
  }

  var covered = true;
  var tile, tileCoordKey, loaded;
  for (var x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (var y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tileCoordKey = this.getKeyZXY(z, x, y);
      loaded = false;
      if (tileCache.containsKey(tileCoordKey)) {
        tile = /** @type {!ol.Tile} */ (tileCache.get(tileCoordKey));
        loaded = tile.getState() === _ol_TileState_.LOADED;
        if (loaded) {
          loaded = (callback(tile) !== false);
        }
      }
      if (!loaded) {
        covered = false;
      }
    }
  }
  return covered;
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @return {number} Gutter.
 */
_ol_source_Tile_.prototype.getGutter = function(projection) {
  return 0;
};


/**
 * Return the key to be used for all tiles in the source.
 * @return {string} The key for all tiles.
 * @protected
 */
_ol_source_Tile_.prototype.getKey = function() {
  return this.key_;
};


/**
 * Set the value to be used as the key for all tiles in the source.
 * @param {string} key The key for tiles.
 * @protected
 */
_ol_source_Tile_.prototype.setKey = function(key) {
  if (this.key_ !== key) {
    this.key_ = key;
    this.changed();
  }
};


/**
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {string} Key.
 * @protected
 */
_ol_source_Tile_.prototype.getKeyZXY = _ol_tilecoord_.getKeyZXY;


/**
 * @param {ol.proj.Projection} projection Projection.
 * @return {boolean} Opaque.
 */
_ol_source_Tile_.prototype.getOpaque = function(projection) {
  return this.opaque_;
};


/**
 * @inheritDoc
 */
_ol_source_Tile_.prototype.getResolutions = function() {
  return this.tileGrid.getResolutions();
};


/**
 * @abstract
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {!ol.Tile} Tile.
 */
_ol_source_Tile_.prototype.getTile = function(z, x, y, pixelRatio, projection) {};


/**
 * Return the tile grid of the tile source.
 * @return {ol.tilegrid.TileGrid} Tile grid.
 * @api
 */
_ol_source_Tile_.prototype.getTileGrid = function() {
  return this.tileGrid;
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @return {!ol.tilegrid.TileGrid} Tile grid.
 */
_ol_source_Tile_.prototype.getTileGridForProjection = function(projection) {
  if (!this.tileGrid) {
    return _ol_tilegrid_.getForProjection(projection);
  } else {
    return this.tileGrid;
  }
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.TileCache} Tile cache.
 * @protected
 */
_ol_source_Tile_.prototype.getTileCacheForProjection = function(projection) {
  var thisProj = this.getProjection();
  if (thisProj && !_ol_proj_.equivalent(thisProj, projection)) {
    return null;
  } else {
    return this.tileCache;
  }
};


/**
 * Get the tile pixel ratio for this source. Subclasses may override this
 * method, which is meant to return a supported pixel ratio that matches the
 * provided `pixelRatio` as close as possible.
 * @param {number} pixelRatio Pixel ratio.
 * @return {number} Tile pixel ratio.
 */
_ol_source_Tile_.prototype.getTilePixelRatio = function(pixelRatio) {
  return this.tilePixelRatio_;
};


/**
 * @param {number} z Z.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.Size} Tile size.
 */
_ol_source_Tile_.prototype.getTilePixelSize = function(z, pixelRatio, projection) {
  var tileGrid = this.getTileGridForProjection(projection);
  var tilePixelRatio = this.getTilePixelRatio(pixelRatio);
  var tileSize = _ol_size_.toSize(tileGrid.getTileSize(z), this.tmpSize);
  if (tilePixelRatio == 1) {
    return tileSize;
  } else {
    return _ol_size_.scale(tileSize, tilePixelRatio, this.tmpSize);
  }
};


/**
 * Returns a tile coordinate wrapped around the x-axis. When the tile coordinate
 * is outside the resolution and extent range of the tile grid, `null` will be
 * returned.
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.proj.Projection=} opt_projection Projection.
 * @return {ol.TileCoord} Tile coordinate to be passed to the tileUrlFunction or
 *     null if no tile URL should be created for the passed `tileCoord`.
 */
_ol_source_Tile_.prototype.getTileCoordForTileUrlFunction = function(tileCoord, opt_projection) {
  var projection = opt_projection !== undefined ?
    opt_projection : this.getProjection();
  var tileGrid = this.getTileGridForProjection(projection);
  if (this.getWrapX() && projection.isGlobal()) {
    tileCoord = _ol_tilegrid_.wrapX(tileGrid, tileCoord, projection);
  }
  return _ol_tilecoord_.withinExtentAndZ(tileCoord, tileGrid) ? tileCoord : null;
};


/**
 * @inheritDoc
 */
_ol_source_Tile_.prototype.refresh = function() {
  this.tileCache.clear();
  this.changed();
};


/**
 * Marks a tile coord as being used, without triggering a load.
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 * @param {ol.proj.Projection} projection Projection.
 */
_ol_source_Tile_.prototype.useTile = _ol_.nullFunction;


/**
 * @classdesc
 * Events emitted by {@link ol.source.Tile} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.source.Tile.Event}
 * @param {string} type Type.
 * @param {ol.Tile} tile The tile.
 */
_ol_source_Tile_.Event = function(type, tile) {

  _ol_events_Event_.call(this, type);

  /**
   * The tile related to the event.
   * @type {ol.Tile}
   * @api
   */
  this.tile = tile;

};
_ol_.inherits(_ol_source_Tile_.Event, _ol_events_Event_);
export default _ol_source_Tile_;
