goog.provide('ol.source.TileDebug');

goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.size');
goog.require('ol.source.Tile');
goog.require('ol.tilecoord');



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Size} tileSize Tile size.
 * @param {string} text Text.
 * @private
 */
ol.DebugTile_ = function(tileCoord, tileSize, text) {

  goog.base(this, tileCoord, ol.TileState.LOADED);

  /**
   * @private
   * @type {ol.Size}
   */
  this.tileSize_ = tileSize;

  /**
   * @private
   * @type {string}
   */
  this.text_ = text;

  /**
   * @private
   * @type {Object.<number, HTMLCanvasElement>}
   */
  this.canvasByContext_ = {};

};
goog.inherits(ol.DebugTile_, ol.Tile);


/**
 * Get the image element for this tile.
 * @param {Object=} opt_context Optional context. Only used by the DOM
 *     renderer.
 * @return {HTMLCanvasElement} Image.
 */
ol.DebugTile_.prototype.getImage = function(opt_context) {
  var key = opt_context !== undefined ? goog.getUid(opt_context) : -1;
  if (key in this.canvasByContext_) {
    return this.canvasByContext_[key];
  } else {

    var tileSize = this.tileSize_;
    var context = ol.dom.createCanvasContext2D(tileSize[0], tileSize[1]);

    context.strokeStyle = 'black';
    context.strokeRect(0.5, 0.5, tileSize[0] + 0.5, tileSize[1] + 0.5);

    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '24px sans-serif';
    context.fillText(this.text_, tileSize[0] / 2, tileSize[1] / 2);

    this.canvasByContext_[key] = context.canvas;
    return context.canvas;

  }
};



/**
 * @classdesc
 * A pseudo tile source, which does not fetch tiles from a server, but renders
 * a grid outline for the tile grid/projection along with the coordinates for
 * each tile. See examples/canvas-tiles for an example.
 *
 * Uses Canvas context2d, so requires Canvas support.
 *
 * @constructor
 * @extends {ol.source.Tile}
 * @param {olx.source.TileDebugOptions} options Debug tile options.
 * @api
 */
ol.source.TileDebug = function(options) {

  goog.base(this, {
    opaque: false,
    projection: options.projection,
    tileGrid: options.tileGrid,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

};
goog.inherits(ol.source.TileDebug, ol.source.Tile);


/**
 * @inheritDoc
 */
ol.source.TileDebug.prototype.getTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.DebugTile_} */ (this.tileCache.get(tileCoordKey));
  } else {
    var tileSize = ol.size.toSize(this.tileGrid.getTileSize(z));
    var tileCoord = [z, x, y];
    var textTileCoord = this.getTileCoordForTileUrlFunction(tileCoord);
    var text = !textTileCoord ? '' : ol.tilecoord.toString(
        this.getTileCoordForTileUrlFunction(textTileCoord));
    var tile = new ol.DebugTile_(tileCoord, tileSize, text);
    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};
