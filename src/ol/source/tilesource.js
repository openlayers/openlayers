goog.provide('ol.source.Tile');
goog.provide('ol.source.TileOptions');

goog.require('goog.functions');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.TileRange');
goog.require('ol.source.Source');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            opaque: (boolean|undefined),
 *            tilePixelRatio: (number|undefined),
 *            projection: ol.proj.ProjectionLike,
 *            state: (ol.source.State|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined)}}
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
 */
ol.source.Tile = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection,
    state: options.state
  });

  /**
   * @private
   * @type {boolean}
   */
  this.opaque_ = goog.isDef(options.opaque) ? options.opaque : false;

  /**
   * @private
   * @type {number}
   */
  this.tilePixelRatio_ = goog.isDef(options.tilePixelRatio) ?
      options.tilePixelRatio : 1;

  /**
   * @protected
   * @type {ol.tilegrid.TileGrid}
   */
  this.tileGrid = goog.isDef(options.tileGrid) ? options.tileGrid : null;

};
goog.inherits(ol.source.Tile, ol.source.Source);


/**
 * @return {boolean} Can expire cache.
 */
ol.source.Tile.prototype.canExpireCache = goog.functions.FALSE;


/**
 * @param {Object.<string, ol.TileRange>} usedTiles Used tiles.
 */
ol.source.Tile.prototype.expireCache = goog.abstractMethod;


/**
 * Look for loaded tiles over a given tile range and zoom level.  Adds
 * properties to the provided lookup representing key/tile pairs for already
 * loaded tiles.
 *
 * @param {Object.<number, Object.<string, ol.Tile>>} loadedTilesByZ A lookup of
 *     loaded tiles by zoom level.
 * @param {function(number, number, number): ol.Tile} getTileIfLoaded A function
 *     that returns the tile only if it is fully loaded.
 * @param {number} z Zoom level.
 * @param {ol.TileRange} tileRange Tile range.
 * @return {boolean} The tile range is fully covered with loaded tiles.
 */
ol.source.Tile.prototype.findLoadedTiles = function(loadedTilesByZ,
    getTileIfLoaded, z, tileRange) {
  // FIXME this could be more efficient about filling partial holes
  var fullyCovered = true;
  var tile, tileCoordKey, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tileCoordKey = this.getKeyZXY(z, x, y);
      if (loadedTilesByZ[z] && loadedTilesByZ[z][tileCoordKey]) {
        continue;
      }
      tile = getTileIfLoaded(z, x, y);
      if (!goog.isNull(tile)) {
        if (!loadedTilesByZ[z]) {
          loadedTilesByZ[z] = {};
        }
        loadedTilesByZ[z][tileCoordKey] = tile;
      } else {
        fullyCovered = false;
      }
    }
  }
  return fullyCovered;
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
 * @param {ol.proj.Projection=} opt_projection Projection.
 * @return {!ol.Tile} Tile.
 */
ol.source.Tile.prototype.getTile = goog.abstractMethod;


/**
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
  if (goog.isNull(this.tileGrid)) {
    return ol.tilegrid.getForProjection(projection);
  } else {
    return this.tileGrid;
  }
};


/**
 * @param {number} z Z.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {number} Tile size.
 */
ol.source.Tile.prototype.getTilePixelSize =
    function(z, pixelRatio, projection) {
  var tileGrid = this.getTileGridForProjection(projection);
  return tileGrid.getTileSize(z) * this.tilePixelRatio_;
};


/**
 * Marks a tile coord as being used, without triggering a load.
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 */
ol.source.Tile.prototype.useTile = goog.nullFunction;
