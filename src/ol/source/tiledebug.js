import _ol_ from '../index';
import _ol_Tile_ from '../tile';
import _ol_TileState_ from '../tilestate';
import _ol_dom_ from '../dom';
import _ol_size_ from '../size';
import _ol_source_Tile_ from '../source/tile';

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
var _ol_source_TileDebug_ = function(options) {

  _ol_source_Tile_.call(this, {
    opaque: false,
    projection: options.projection,
    tileGrid: options.tileGrid,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

};

_ol_.inherits(_ol_source_TileDebug_, _ol_source_Tile_);


/**
 * @inheritDoc
 */
_ol_source_TileDebug_.prototype.getTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.source.TileDebug.Tile_} */ (this.tileCache.get(tileCoordKey));
  } else {
    var tileSize = _ol_size_.toSize(this.tileGrid.getTileSize(z));
    var tileCoord = [z, x, y];
    var textTileCoord = this.getTileCoordForTileUrlFunction(tileCoord);
    var text = !textTileCoord ? '' :
      this.getTileCoordForTileUrlFunction(textTileCoord).toString();
    var tile = new _ol_source_TileDebug_.Tile_(tileCoord, tileSize, text);
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
_ol_source_TileDebug_.Tile_ = function(tileCoord, tileSize, text) {

  _ol_Tile_.call(this, tileCoord, _ol_TileState_.LOADED);

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
_ol_.inherits(_ol_source_TileDebug_.Tile_, _ol_Tile_);


/**
 * Get the image element for this tile.
 * @return {HTMLCanvasElement} Image.
 */
_ol_source_TileDebug_.Tile_.prototype.getImage = function() {
  if (this.canvas_) {
    return this.canvas_;
  } else {
    var tileSize = this.tileSize_;
    var context = _ol_dom_.createCanvasContext2D(tileSize[0], tileSize[1]);

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


/**
 * @override
 */
_ol_source_TileDebug_.Tile_.prototype.load = function() {};
export default _ol_source_TileDebug_;
