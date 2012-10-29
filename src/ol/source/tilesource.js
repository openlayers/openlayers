goog.provide('ol.source.TileSource');
goog.provide('ol.source.TileSourceOptions');

goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Projection');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.source.Source');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            crossOrigin: (null|string|undefined),
 *            extent: (ol.Extent|undefined),
 *            projection: (ol.Projection|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined)}}
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

  /**
   * @protected
   * @type {ol.TileUrlFunctionType}
   */
  this.tileUrlFunction = goog.isDef(tileSourceOptions.tileUrlFunction) ?
      tileSourceOptions.tileUrlFunction :
      ol.TileUrlFunction.nullTileUrlFunction;

  /**
   * @private
   * @type {?string}
   */
  this.crossOrigin_ = goog.isDef(tileSourceOptions.crossOrigin) ?
      tileSourceOptions.crossOrigin : 'anonymous';

  /**
   * @private
   * @type {Object.<string, ol.Tile>}
   * FIXME will need to expire elements from this cache
   * FIXME see elemoine's work with goog.structs.LinkedMap
   */
  this.tileCache_ = {};

};
goog.inherits(ol.source.TileSource, ol.source.Source);


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
ol.source.TileSource.prototype.getTile = function(tileCoord) {
  var key = tileCoord.toString();
  if (goog.object.containsKey(this.tileCache_, key)) {
    return this.tileCache_[key];
  } else {
    var tileUrl = this.getTileCoordUrl(tileCoord);
    var tile;
    if (goog.isDef(tileUrl)) {
      tile = new ol.Tile(tileCoord, tileUrl, this.crossOrigin_);
    } else {
      tile = null;
    }
    this.tileCache_[key] = tile;
    return tile;
  }
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {string|undefined} Tile URL.
 */
ol.source.TileSource.prototype.getTileCoordUrl = function(tileCoord) {
  return this.tileUrlFunction(tileCoord);
};


/**
 * @return {ol.tilegrid.TileGrid} Tile grid.
 */
ol.source.TileSource.prototype.getTileGrid = function() {
  return this.tileGrid;
};
