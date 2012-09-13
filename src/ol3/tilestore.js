goog.provide('ol3.TileStore');

goog.require('ol3.Attribution');
goog.require('ol3.Store');
goog.require('ol3.Tile');
goog.require('ol3.TileCoord');
goog.require('ol3.TileGrid');
goog.require('ol3.TileUrlFunctionType');



/**
 * @constructor
 * @extends {ol3.Store}
 * @param {ol3.Projection} projection Projection.
 * @param {ol3.TileGrid} tileGrid Tile grid.
 * @param {ol3.TileUrlFunctionType} tileUrlFunction Tile URL.
 * @param {ol3.Extent=} opt_extent Extent.
 * @param {Array.<string>=} opt_attributions Attributions.
 * @param {?string=} opt_crossOrigin Cross origin.
 */
ol3.TileStore = function(projection, tileGrid, tileUrlFunction, opt_extent,
    opt_attributions, opt_crossOrigin) {

  goog.base(this, projection, opt_extent, opt_attributions);

  /**
   * @protected
   * @type {ol3.TileGrid}
   */
  this.tileGrid = tileGrid;

  /**
   * @protected
   * @type {ol3.TileUrlFunctionType}
   */
  this.tileUrlFunction = tileUrlFunction;

  /**
   * @private
   * @type {?string}
   */
  this.crossOrigin_ = opt_crossOrigin || 'anonymous';

  /**
   * @private
   * @type {Object.<string, ol3.Tile>}
   * FIXME will need to expire elements from this cache
   * FIXME see elemoine's work with goog.structs.LinkedMap
   */
  this.tileCache_ = {};

};
goog.inherits(ol3.TileStore, ol3.Store);


/**
 * @inheritDoc
 */
ol3.TileStore.prototype.getResolutions = function() {
  return this.tileGrid.getResolutions();
};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @return {ol3.Tile} Tile.
 */
ol3.TileStore.prototype.getTile = function(tileCoord) {
  var key = tileCoord.toString();
  if (goog.object.containsKey(this.tileCache_, key)) {
    return this.tileCache_[key];
  } else {
    var tileUrl = this.getTileCoordUrl(tileCoord);
    var tile;
    if (goog.isDef(tileUrl)) {
      tile = new ol3.Tile(tileCoord, tileUrl, this.crossOrigin_);
    } else {
      tile = null;
    }
    this.tileCache_[key] = tile;
    return tile;
  }
};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @return {string|undefined} Tile URL.
 */
ol3.TileStore.prototype.getTileCoordUrl = function(tileCoord) {
  return this.tileUrlFunction(tileCoord);
};


/**
 * @return {ol3.TileGrid} Tile grid.
 */
ol3.TileStore.prototype.getTileGrid = function() {
  return this.tileGrid;
};
