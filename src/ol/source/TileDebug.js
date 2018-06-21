/**
 * @module ol/source/TileDebug
 */
import {inherits} from '../util.js';
import Tile from '../Tile.js';
import TileState from '../TileState.js';
import {createCanvasContext2D} from '../dom.js';
import {toSize} from '../size.js';
import TileSource from '../source/Tile.js';
import {getKeyZXY} from '../tilecoord.js';


/**
 * @constructor
 * @extends {module:ol/Tile}
 * @param {module:ol/tilecoord~TileCoord} tileCoord Tile coordinate.
 * @param {module:ol/size~Size} tileSize Tile size.
 * @param {string} text Text.
 */
const LabeledTile = function(tileCoord, tileSize, text) {

  Tile.call(this, tileCoord, TileState.LOADED);

  /**
   * @private
   * @type {module:ol/size~Size}
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
inherits(LabeledTile, Tile);


/**
 * Get the image element for this tile.
 * @return {HTMLCanvasElement} Image.
 */
LabeledTile.prototype.getImage = function() {
  if (this.canvas_) {
    return this.canvas_;
  } else {
    const tileSize = this.tileSize_;
    const context = createCanvasContext2D(tileSize[0], tileSize[1]);

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
LabeledTile.prototype.load = function() {};


/**
 * @typedef {Object} Options
 * @property {module:ol/proj~ProjectionLike} projection Projection.
 * @property {module:ol/tilegrid/TileGrid} [tileGrid] Tile grid.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 */


/**
 * @classdesc
 * A pseudo tile source, which does not fetch tiles from a server, but renders
 * a grid outline for the tile grid/projection along with the coordinates for
 * each tile. See examples/canvas-tiles for an example.
 *
 * Uses Canvas context2d, so requires Canvas support.
 *
 * @constructor
 * @extends {module:ol/source/Tile}
 * @param {module:ol/source/TileDebug~Options=} options Debug tile options.
 * @api
 */
const TileDebug = function(options) {

  TileSource.call(this, {
    opaque: false,
    projection: options.projection,
    tileGrid: options.tileGrid,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

};

inherits(TileDebug, TileSource);


/**
 * @inheritDoc
 */
TileDebug.prototype.getTile = function(z, x, y) {
  const tileCoordKey = getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!module:ol/source/TileDebug~LabeledTile} */ (this.tileCache.get(tileCoordKey));
  } else {
    const tileSize = toSize(this.tileGrid.getTileSize(z));
    const tileCoord = [z, x, y];
    const textTileCoord = this.getTileCoordForTileUrlFunction(tileCoord);
    const text = !textTileCoord ? '' :
      this.getTileCoordForTileUrlFunction(textTileCoord).toString();
    const tile = new LabeledTile(tileCoord, tileSize, text);
    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


export default TileDebug;
