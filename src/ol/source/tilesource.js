goog.provide('ol.source.TileSource');
goog.provide('ol.source.TileSourceOptions');

goog.require('goog.functions');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.source.Source');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|undefined),
 *            opaque: (boolean|undefined),
 *            projection: ol.ProjectionLike,
 *            tileGrid: (ol.tilegrid.TileGrid|undefined)}}
 */
ol.source.TileSourceOptions;



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.TileSourceOptions} options Tile source options.
 */
ol.source.TileSource = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection
  });

  /**
   * @private
   * @type {boolean}
   */
  this.opaque_ = goog.isDef(options.opaque) ? options.opaque : false;

  /**
   * @protected
   * @type {ol.tilegrid.TileGrid}
   */
  this.tileGrid = goog.isDef(options.tileGrid) ? options.tileGrid : null;

};
goog.inherits(ol.source.TileSource, ol.source.Source);


/**
 * @return {boolean} Can expire cache.
 */
ol.source.TileSource.prototype.canExpireCache = goog.functions.FALSE;


/**
 * @param {Object.<string, ol.TileRange>} usedTiles Used tiles.
 */
ol.source.TileSource.prototype.expireCache = goog.abstractMethod;


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
ol.source.TileSource.prototype.findLoadedTiles = function(loadedTilesByZ,
    getTileIfLoaded, z, tileRange) {
  // FIXME this could be more efficient about filling partial holes
  var fullyCovered = true;
  var tile, tileCoordKey, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tileCoordKey = ol.TileCoord.getKeyZXY(z, x, y);
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
 * @return {boolean} Opaque.
 */
ol.source.TileSource.prototype.getOpaque = function() {
  return this.opaque_;
};


/**
 * @inheritDoc
 */
ol.source.TileSource.prototype.getResolutions = function() {
  return this.tileGrid.getResolutions();
};


/**
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 * @param {ol.Projection=} opt_projection Projection.
 * @return {!ol.Tile} Tile.
 */
ol.source.TileSource.prototype.getTile = goog.abstractMethod;


/**
 * @return {ol.tilegrid.TileGrid} Tile grid.
 */
ol.source.TileSource.prototype.getTileGrid = function() {
  return this.tileGrid;
};


/**
 * Marks a tile coord as being used, without triggering a load.
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 */
ol.source.TileSource.prototype.useTile = goog.nullFunction;
