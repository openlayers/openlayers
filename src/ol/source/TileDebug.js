/**
 * @module ol/source/TileDebug
 */

import ImageTile from './ImageTile.js';
import {createCanvasContext2D} from '../dom.js';
import {renderXYZTemplate} from '../uri.js';

/**
 * @typedef {Object} Options
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Optional projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Set to `1` when debugging `VectorTile` sources with a default configuration.
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 * @property {string} [template='z:{z} x:{x} y:{y}'] Template for labeling the tiles.
 * Should include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 */

/**
 * @classdesc
 * A pseudo tile source, which does not fetch tiles from a server, but renders
 * a grid outline for the tile grid/projection along with the coordinates for
 * each tile. See examples/canvas-tiles for an example.
 * @api
 */
class TileDebug extends ImageTile {
  /**
   * @param {Options} [options] Debug tile options.
   */
  constructor(options) {
    /**
     * @type {Options}
     */
    options = options || {};
    const template = options.template || 'z:{z} x:{x} y:{y}';

    super({
      transition: 0,
      projection: options.projection,
      tileGrid: options.tileGrid,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      zDirection: options.zDirection,
      loader: (z, x, y, loaderOptions) => {
        const text = renderXYZTemplate(template, z, x, y, loaderOptions.maxY);
        const tileSize = this.getTileSize(z);
        const context = createCanvasContext2D(tileSize[0], tileSize[1]);

        context.strokeStyle = 'grey';
        context.strokeRect(0.5, 0.5, tileSize[0] + 0.5, tileSize[1] + 0.5);

        context.fillStyle = 'grey';
        context.strokeStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '24px sans-serif';
        context.lineWidth = 4;
        context.strokeText(text, tileSize[0] / 2, tileSize[1] / 2, tileSize[0]);
        context.fillText(text, tileSize[0] / 2, tileSize[1] / 2, tileSize[0]);
        return context.canvas;
      },
    });
  }
}

export default TileDebug;
