goog.provide('ol.source.TileDebug');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.dom');
goog.require('ol.size');
goog.require('ol.source.Tile');


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

  ol.source.Tile.call(this, {
    opaque: false,
    projection: options.projection,
    tileGrid: options.tileGrid,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

};
ol.inherits(ol.source.TileDebug, ol.source.Tile);


/**
 * @inheritDoc
 */
ol.source.TileDebug.prototype.getTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.source.TileDebug.Tile_} */ (this.tileCache.get(tileCoordKey));
  } else {
    var tileSize = ol.size.toSize(this.tileGrid.getTileSize(z));
    var tileCoord = [z, x, y];
    var textTileCoord = this.getTileCoordForTileUrlFunction(tileCoord);
    var text = !textTileCoord ? '' :
        this.getTileCoordForTileUrlFunction(textTileCoord).toString();
    var tile = new ol.source.TileDebug.Tile_(tileCoord, tileSize, text);
    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Size} tileSize Tile size.
 * @param {string} text Text.
 * @private
 */
ol.source.TileDebug.Tile_ = function(tileCoord, tileSize, text) {

  ol.Tile.call(this, tileCoord, ol.Tile.State.LOADED);

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
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

};
ol.inherits(ol.source.TileDebug.Tile_, ol.Tile);


/**
 * Get the image element for this tile.
 * @return {HTMLCanvasElement} Image.
 */
ol.source.TileDebug.Tile_.prototype.getImage = function() {
  if (this.canvas_) {
    return this.canvas_;
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

    this.canvas_ = context.canvas;
    return context.canvas;
  }
};
