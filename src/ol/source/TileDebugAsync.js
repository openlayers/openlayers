/**
 * @module ol/source/TileDebugAsync
 */

import Tile from '../Tile.js';
import TileState from '../TileState.js';
import {createCanvasContext2D} from '../dom.js';
import {toSize} from '../size.js';
import XYZ from './XYZ.js';
import {getKeyZXY} from '../tilecoord.js';
import EventType from '../events/EventType.js';


class LabeledTileAsync extends Tile {
  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../size.js").Size} tileSize Tile size.
   * @param {string} text Text.
   */
  constructor(tileCoord, tileSize, text) {

    super(tileCoord, TileState.LOADING);

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


    setTimeout(function(){

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
      context.strokeText(this.text_, tileSize[0] / 2, tileSize[1] / 2, tileSize[0]);
      context.fillText(this.text_, tileSize[0] / 2, tileSize[1] / 2, tileSize[0]);


      console.log("Done ", this.text_);

      this.canvas_ = context.canvas;

//       this.state = TileState.LOADED;
//       this.changed(); // Notifies the tile layer containing this tile that the tile has changed
      this.setState(TileState.LOADED);

      return context.canvas;

    }.bind(this), Math.random() * 10000);

  }

  /**
  * Get the image element for this tile.
  * @return {HTMLCanvasElement} Image.
  */
  getImage() {
      return this.canvas_;
  }

  /**
  * @override
  */
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
 * each tile. Each tile is rendered after a random delay.
 *
 * Uses Canvas context2d, so requires Canvas support.
 * @api
 */
class TileDebugAsync extends XYZ {
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
      zDirection: options.zDirection
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
      let text;
      if (textTileCoord) {
        text = 'z:' + textTileCoord[0] + ' x:' + textTileCoord[1] + ' y:' + textTileCoord[2];
      } else {
        text = 'none';
      }

      // Instantiate tile
      const tile = new LabeledTileAsync(tileCoord, tileSize, text);

      // Listen to the tile when it has finished loading, mark the tile layer as
      // changed in order to trigger a redraw
      tile.addEventListener(EventType.CHANGE, this.changed.bind(this));

      this.tileCache.set(tileCoordKey, tile);
      return tile;
    }
  }

}


export default TileDebugAsync;
