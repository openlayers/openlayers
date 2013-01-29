goog.provide('ol.source.TileSource');
goog.provide('ol.source.TileSourceOptions');

goog.require('goog.functions');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Projection');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
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
