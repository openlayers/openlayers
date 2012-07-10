goog.provide('ol.TileStore');

goog.require('ol.Store');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');
goog.require('ol.TileUrlFunctionType');



/**
 * @constructor
 * @extends {ol.Store}
 * @param {ol.TileGrid} tileGrid Tile grid.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL.
 */
ol.TileStore = function(tileGrid, tileUrlFunction) {

  goog.base(this);

  /**
   * @private
   * @type {ol.TileGrid}
   */
  this.tileGrid_ = tileGrid;

  /**
   * @private
   * @type {ol.TileUrlFunctionType}
   */
  this.tileUrlFunction_ = tileUrlFunction;

};
goog.inherits(ol.TileStore, ol.Store);


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {string} Tile coord URL.
 */
ol.TileStore.prototype.getTileCoordUrl = function(tileCoord) {
  // FIXME maybe wrap x and y
  return this.tileUrlFunction_(tileCoord);
};


/**
 * @return {ol.TileGrid} Tile grid.
 */
ol.TileStore.prototype.getTileGrid = function() {
  return this.tileGrid_;
};
