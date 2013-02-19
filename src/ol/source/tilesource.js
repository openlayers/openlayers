goog.provide('ol.source.TileSource');
goog.provide('ol.source.TileSourceOptions');

goog.require('goog.functions');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Projection');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.source.Source');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            extent: (ol.Extent|undefined),
 *            projection: (ol.Projection|undefined),
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
 * @param {function(ol.Tile): boolean} isLoaded A function to determine if a
 *     tile is fully loaded.
 * @param {number} z Zoom level.
 * @param {ol.TileRange} tileRange Tile range.
 * @return {boolean} The tile range is fully covered with loaded tiles.
 */
ol.source.TileSource.prototype.findLoadedTiles = function(loadedTilesByZ,
    isLoaded, z, tileRange) {
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
      tile = this.getTile(tileCoord);
      if (isLoaded(tile)) {
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
 * @inheritDoc
 */
ol.source.TileSource.prototype.getResolutions = function() {
  return this.tileGrid.getResolutions();
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {ol.Tile} Tile.
 */
ol.source.TileSource.prototype.getTile = goog.abstractMethod;


/**
 * @return {ol.tilegrid.TileGrid} Tile grid.
 */
ol.source.TileSource.prototype.getTileGrid = function() {
  return this.tileGrid;
};
