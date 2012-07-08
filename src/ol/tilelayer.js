goog.provide('ol.TileLayer');

goog.require('ol.Layer');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');
goog.require('ol.TileUrlFunctionType');



/**
 * @constructor
 * @extends {ol.Layer}
 * @param {ol.TileGrid} tileGrid Tile grid.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL.
 */
ol.TileLayer = function(tileGrid, tileUrlFunction) {

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
goog.inherits(ol.TileLayer, ol.Layer);


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {string} Tile coord URL.
 */
ol.TileLayer.prototype.getTileCoordUrl = function(tileCoord) {
  // FIXME maybe wrap x and y
  return this.tileUrlFunction_(tileCoord);
};


/**
 * @return {ol.TileGrid} Tile grid.
 */
ol.TileLayer.prototype.getTileGrid = function() {
  return this.tileGrid_;
};
