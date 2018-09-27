/**
 * @module ol/source/TileDebug
 */

import Tile from '../Tile.js';
import TileState from '../TileState.js';
import {createCanvasContext2D} from '../dom.js';
import {toSize} from '../size.js';
import TileSource from '../source/Tile.js';
import {getKeyZXY} from '../tilecoord.js';


class LabeledTile extends Tile {
  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../size.js").Size} tileSize Tile size.
   * @param {string} text Text.
   */
  constructor(tileCoord, tileSize, text) {

    super(tileCoord, TileState.LOADED);

    /**
    * @private
    * @type {import("../size.js").Size}
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

  }

  /**
  * Get the image element for this tile.
  * @return {HTMLCanvasElement} Image.
  */
  getImage() {
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
  }

  /**
  * @override
  */
  load() {}
}


/**
 * @typedef {Object} Options
 * @property {import("../proj.js").ProjectionLike} projection Projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 */


/**
 * @classdesc
 * A pseudo tile source, which does not fetch tiles from a server, but renders
 * a grid outline for the tile grid/projection along with the coordinates for
 * each tile. See examples/canvas-tiles for an example.
 *
 * Uses Canvas context2d, so requires Canvas support.
 * @api
 */
class TileDebug extends TileSource {
  /**
   * @param {Options} options Debug tile options.
   */
  constructor(options) {

    super({
      opaque: false,
      projection: options.projection,
      tileGrid: options.tileGrid,
      wrapX: options.wrapX !== undefined ? options.wrapX : true
    });

  }

  /**
  * @inheritDoc
  */
  getTile(z, x, y) {
    const tileCoordKey = getKeyZXY(z, x, y);
    if (this.tileCache.containsKey(tileCoordKey)) {
      return /** @type {!LabeledTile} */ (this.tileCache.get(tileCoordKey));
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
  }
}


export default TileDebug;
