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
 *            opaque: (boolean|undefined),
 *            projection: ol.ProjectionLike,
 *            tileGrid: (ol.tilegrid.TileGrid|undefined)}}
 */
ol.source.TileSourceOptions;



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.TileSourceOptions} tileSourceOptions Tile source options.
 */
ol.source.TileSource = function(tileSourceOptions) {

  goog.base(this, {
    attributions: tileSourceOptions.attributions,
    extent: tileSourceOptions.extent,
    projection: tileSourceOptions.projection
  });

  /**
   * @private
   * @type {boolean}
   */
  this.opaque_ = goog.isDef(tileSourceOptions.opaque) ?
      tileSourceOptions.opaque : false;

  /**
   * @protected
   * @type {ol.tilegrid.TileGrid}
   */
  this.tileGrid = goog.isDef(tileSourceOptions.tileGrid) ?
      tileSourceOptions.tileGrid : null;

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
 * @param {function(ol.TileCoord): ol.Tile} getTileIfLoaded A function that
 *     returns the tile only if it is fully loaded.
 * @param {number} z Zoom level.
 * @param {ol.TileRange} tileRange Tile range.
 * @return {boolean} The tile range is fully covered with loaded tiles.
 */
ol.source.TileSource.prototype.findLoadedTiles = function(loadedTilesByZ,
    getTileIfLoaded, z, tileRange) {
  // FIXME this could be more efficient about filling partial holes
  var fullyCovered = true;
  var tile, tileCoord, tileCoordKey, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tileCoord = new ol.TileCoord(z, x, y);
      tileCoordKey = tileCoord.toString();
      if (loadedTilesByZ[z] && loadedTilesByZ[z][tileCoordKey]) {
        continue;
      }
      tile = getTileIfLoaded(tileCoord);
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
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.tilegrid.TileGrid=} opt_tileGrid Tile grid.
 * @param {ol.Projection=} opt_projection Projection.
 * @return {ol.Tile} Tile.
 */
ol.source.TileSource.prototype.getTile = goog.abstractMethod;


/**
 * @return {ol.tilegrid.TileGrid} Tile grid.
 */
ol.source.TileSource.prototype.getTileGrid = function() {
  return this.tileGrid;
};


/**
 * @param {number} z Z.
 * @param {ol.Extent} extent Extent.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 */
ol.source.TileSource.prototype.useLowResolutionTiles =
    function(z, extent, tileGrid) {
  var tileRange, x, y, zKey;
  // FIXME this should loop up to tileGrid's minZ when implemented
  for (; z >= 0; --z) {
    tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
        this.useTile(z + '/' + x + '/' + y);
      }
    }
  }
};


/**
 * Marks a tile coord as being used, without triggering a load.
 * @param {string} tileCoordKey Tile coordinate key.
 */
ol.source.TileSource.prototype.useTile = goog.nullFunction;
