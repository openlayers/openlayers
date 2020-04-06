/**
 * @module ol/source/TileDebug
 */

import Tile from '../Tile.js';
import TileState from '../TileState.js';
import XYZ from './XYZ.js';
import {createCanvasContext2D} from '../dom.js';
import {getKeyZXY} from '../tilecoord.js';
import {toSize} from '../size.js';

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

      context.strokeStyle = 'grey';
      context.strokeRect(0.5, 0.5, tileSize[0] + 0.5, tileSize[1] + 0.5);

      context.fillStyle = 'grey';
      context.strokeStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '24px sans-serif';
      context.lineWidth = 4;
      context.strokeText(
        this.text_,
        tileSize[0] / 2,
        tileSize[1] / 2,
        tileSize[0]
      );
      context.fillText(
        this.text_,
        tileSize[0] / 2,
        tileSize[1] / 2,
        tileSize[0]
      );

      this.canvas_ = context.canvas;
      return context.canvas;
    }
  }

  load() {}
}

/**
 * @typedef {Object} Options
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Optional projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number} [zDirection=0] Set to `1` when debugging `VectorTile` sources with
 * a default configuration. Indicates which resolution should be used by a renderer if
 * the view resolution does not match any resolution of the tile source. If 0, the nearest
 * resolution will be used. If 1, the nearest lower resolution will be used. If -1, the
 * nearest higher resolution will be used.
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
class TileDebug extends XYZ {
  /**
   * @param {Options=} opt_options Debug tile options.
   */
  constructor(opt_options) {
    /**
     * @type {Options}
     */
    const options = opt_options || {};

    super({
      opaque: false,
      projection: options.projection,
      tileGrid: options.tileGrid,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      zDirection: options.zDirection,
    });
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @return {!LabeledTile} Tile.
   */
  getTile(z, x, y) {
    const tileCoordKey = getKeyZXY(z, x, y);
    if (this.tileCache.containsKey(tileCoordKey)) {
      return /** @type {!LabeledTile} */ (this.tileCache.get(tileCoordKey));
    } else {
      const tileSize = toSize(this.tileGrid.getTileSize(z));
      const tileCoord = [z, x, y];
      const textTileCoord = this.getTileCoordForTileUrlFunction(tileCoord);
      let text;
      if (textTileCoord) {
        text =
          'z:' +
          textTileCoord[0] +
          ' x:' +
          textTileCoord[1] +
          ' y:' +
          textTileCoord[2];
      } else {
        text = 'none';
      }
      const tile = new LabeledTile(tileCoord, tileSize, text);
      this.tileCache.set(tileCoordKey, tile);
      return tile;
    }
  }
}

export default TileDebug;
