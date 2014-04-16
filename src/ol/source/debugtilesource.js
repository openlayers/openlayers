goog.provide('ol.source.TileDebug');

goog.require('ol.Tile');
goog.require('ol.TileCache');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.source.Tile');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @private
 */
ol.DebugTile_ = function(tileCoord, tileGrid) {

  goog.base(this, tileCoord, ol.TileState.LOADED);

  /**
   * @private
   * @type {ol.TileCoord}
   */
  this.tileCoord_ = tileCoord;

  /**
   * @private
   * @type {number}
   */
  this.tileSize_ = tileGrid.getTileSize(tileCoord.z);

  /**
   * @private
   * @type {Object.<number, HTMLCanvasElement>}
   */
  this.canvasByContext_ = {};

};
goog.inherits(ol.DebugTile_, ol.Tile);


/**
 * @inheritDoc
 */
ol.DebugTile_.prototype.getImage = function(opt_context) {
  var key = goog.isDef(opt_context) ? goog.getUid(opt_context) : -1;
  if (key in this.canvasByContext_) {
    return this.canvasByContext_[key];
  } else {

    var tileSize = this.tileSize_;
    var context = ol.dom.createCanvasContext2D(tileSize, tileSize);

    context.strokeStyle = 'black';
    context.strokeRect(0.5, 0.5, tileSize + 0.5, tileSize + 0.5);

    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '24px sans-serif';
    context.fillText(
        this.tileCoord_.toString(), tileSize / 2, tileSize / 2);

    this.canvasByContext_[key] = context.canvas;
    return context.canvas;

  }
};



/**
 * @constructor
 * @extends {ol.source.Tile}
 * @param {olx.source.TileDebugOptions} options Debug tile options.
 * @todo api
 */
ol.source.TileDebug = function(options) {

  goog.base(this, {
    extent: options.extent,
    opaque: false,
    projection: options.projection,
    tileGrid: options.tileGrid
  });

  /**
   * @private
   * @type {ol.TileCache}
   */
  this.tileCache_ = new ol.TileCache();

};
goog.inherits(ol.source.TileDebug, ol.source.Tile);


/**
 * @inheritDoc
 */
ol.source.TileDebug.prototype.canExpireCache = function() {
  return this.tileCache_.canExpireCache();
};


/**
 * @inheritDoc
 */
ol.source.TileDebug.prototype.expireCache = function(usedTiles) {
  this.tileCache_.expireCache(usedTiles);
};


/**
 * @inheritDoc
 */
ol.source.TileDebug.prototype.getTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache_.containsKey(tileCoordKey)) {
    return /** @type {!ol.DebugTile_} */ (this.tileCache_.get(tileCoordKey));
  } else {
    var tile = new ol.DebugTile_(new ol.TileCoord(z, x, y), this.tileGrid);
    this.tileCache_.set(tileCoordKey, tile);
    return tile;
  }
};
