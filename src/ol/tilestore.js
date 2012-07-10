goog.provide('ol.TileStore');

goog.require('ol.Store');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');
goog.require('ol.TileUrlFunctionType');



/**
 * @constructor
 * @extends {ol.Store}
 * @param {ol.TileGrid} tileGrid Tile grid.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL.
 * @param {string=} opt_crossOrigin Cross origin.
 */
ol.TileStore = function(tileGrid, tileUrlFunction, opt_crossOrigin) {

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

  /**
   * @private
   * @type {string|undefined}
   */
  this.crossOrigin_ = opt_crossOrigin;

  /**
   * @private
   * @type {Object.<string, ol.Tile>}
   * FIXME will need to expire elements from this cache
   * FIXME see elemoine's work with goog.structs.LinkedMap
   */
  this.tileCache_ = {};

};
goog.inherits(ol.TileStore, ol.Store);


/**
 * @return {ol.TileStore} Tile store.
 */
ol.TileStore.createOpenStreetMap = function() {

  var tileGrid = ol.TileGrid.createOpenStreetMap(18);
  var tileUrlFunction = ol.TileUrlFunction.createFromTemplates([
    'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
  ]);
  var crossOrigin = '';

  return new ol.TileStore(tileGrid, tileUrlFunction, crossOrigin);

};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {ol.Tile} Tile.
 */
ol.TileStore.prototype.getTile = function(tileCoord) {
  var key = tileCoord.toString();
  if (goog.object.containsKey(this.tileCache_, key)) {
    return this.tileCache_[key];
  } else {
    var tileUrl = this.getTileCoordUrl(tileCoord);
    var tile = new ol.Tile(tileCoord, tileUrl, this.crossOrigin_);
    this.tileCache_[key] = tile;
    return tile;
  }
};


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
