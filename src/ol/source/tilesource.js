goog.provide('ol.source.Tile');
goog.provide('ol.source.TileEvent');
goog.provide('ol.source.TileOptions');

goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('ol');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.TileCache');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.proj');
goog.require('ol.size');
goog.require('ol.source.Source');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            cacheSize: (number|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            opaque: (boolean|undefined),
 *            tilePixelRatio: (number|undefined),
 *            projection: ol.proj.ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            wrapX: (boolean|undefined)}}
 */
ol.source.TileOptions;



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for sources providing images divided into a tile grid.
 *
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.TileOptions} options Tile source options.
 * @api
 */
ol.source.Tile = function(options) {

  goog.base(this, {
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
  this.tileCache = new ol.TileCache(options.cacheSize);

  /**
   * @protected
   * @type {ol.Size}
   */
  this.tmpSize = [0, 0];

};
goog.inherits(ol.source.Tile, ol.source.Source);


/**
 * @return {boolean} Can expire cache.
 */
ol.source.Tile.prototype.canExpireCache = function() {
  return this.tileCache.canExpireCache();
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @param {Object.<string, ol.TileRange>} usedTiles Used tiles.
 */
ol.source.Tile.prototype.expireCache = function(projection, usedTiles) {
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
ol.source.Tile.prototype.forEachLoadedTile =
    function(projection, z, tileRange, callback) {
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
        loaded = tile.getState() === ol.TileState.LOADED;
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
 * @return {number} Gutter.
 */
ol.source.Tile.prototype.getGutter = function() {
  return 0;
};


/**
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {string} Key.
 * @protected
 */
ol.source.Tile.prototype.getKeyZXY = ol.tilecoord.getKeyZXY;


/**
 * @return {boolean} Opaque.
 */
ol.source.Tile.prototype.getOpaque = function() {
  return this.opaque_;
};


/**
 * @inheritDoc
 */
ol.source.Tile.prototype.getResolutions = function() {
  return this.tileGrid.getResolutions();
};


/**
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {!ol.Tile} Tile.
 */
ol.source.Tile.prototype.getTile = goog.abstractMethod;


/**
 * Return the tile grid of the tile source.
 * @return {ol.tilegrid.TileGrid} Tile grid.
 * @api stable
 */
ol.source.Tile.prototype.getTileGrid = function() {
  return this.tileGrid;
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.tilegrid.TileGrid} Tile grid.
 */
ol.source.Tile.prototype.getTileGridForProjection = function(projection) {
  if (!this.tileGrid) {
    return ol.tilegrid.getForProjection(projection);
  } else {
    return this.tileGrid;
  }
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.TileCache} Tile cache.
 * @protected
 */
ol.source.Tile.prototype.getTileCacheForProjection = function(projection) {
  var thisProj = this.getProjection();
  if (thisProj && !ol.proj.equivalent(thisProj, projection)) {
    return null;
  } else {
    return this.tileCache;
  }
};


/**
 * @return {number} Tile pixel ratio.
 */
ol.source.Tile.prototype.getTilePixelRatio = function() {
  return this.tilePixelRatio_;
};


/**
 * @param {number} z Z.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.Size} Tile size.
 */
ol.source.Tile.prototype.getTilePixelSize =
    function(z, pixelRatio, projection) {
  var tileGrid = this.getTileGridForProjection(projection);
  return ol.size.scale(ol.size.toSize(tileGrid.getTileSize(z), this.tmpSize),
      this.tilePixelRatio_, this.tmpSize);
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
ol.source.Tile.prototype.getTileCoordForTileUrlFunction =
    function(tileCoord, opt_projection) {
  var projection = opt_projection !== undefined ?
      opt_projection : this.getProjection();
  var tileGrid = this.getTileGridForProjection(projection);
  goog.asserts.assert(tileGrid, 'tile grid needed');
  if (this.getWrapX() && projection.isGlobal()) {
    tileCoord = ol.tilecoord.wrapX(tileCoord, tileGrid, projection);
  }
  return ol.tilecoord.withinExtentAndZ(tileCoord, tileGrid) ? tileCoord : null;
};


/**
 * Marks a tile coord as being used, without triggering a load.
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 * @param {ol.proj.Projection} projection Projection.
 */
ol.source.Tile.prototype.useTile = ol.nullFunction;



/**
 * @classdesc
 * Events emitted by {@link ol.source.Tile} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {goog.events.Event}
 * @implements {oli.source.TileEvent}
 * @param {string} type Type.
 * @param {ol.Tile} tile The tile.
 */
ol.source.TileEvent = function(type, tile) {

  goog.base(this, type);

  /**
   * The tile related to the event.
   * @type {ol.Tile}
   * @api
   */
  this.tile = tile;

};
goog.inherits(ol.source.TileEvent, goog.events.Event);


/**
 * @enum {string}
 */
ol.source.TileEventType = {

  /**
   * Triggered when a tile starts loading.
   * @event ol.source.TileEvent#tileloadstart
   * @api stable
   */
  TILELOADSTART: 'tileloadstart',

  /**
   * Triggered when a tile finishes loading.
   * @event ol.source.TileEvent#tileloadend
   * @api stable
   */
  TILELOADEND: 'tileloadend',

  /**
   * Triggered if tile loading results in an error.
   * @event ol.source.TileEvent#tileloaderror
   * @api stable
   */
  TILELOADERROR: 'tileloaderror'

};
