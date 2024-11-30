/**
 * @module ol/source/TileDebug
 */

import DataTile from './DataTile.js';
import EventType from '../events/EventType.js';
import ImageTile from './ImageTile.js';
import {createCanvasContext2D} from '../dom.js';
import {get as getProjection} from '../proj.js';
import {renderXYZTemplate} from '../uri.js';
import {toSize} from '../size.js';

/**
 * @typedef {Object} Options
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Optional projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Set to `1` when debugging `VectorTile` sources with a default configuration.
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 * @property {import("./Tile.js").default} [source] Tile source.
 * This allows `projection`, `tileGrid`, `wrapX` and `zDirection` to be copied from another source.
 * If both `source` and individual options are specified the individual options will have precedence.
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
    const source = options.source;

    super({
      transition: 0,
      wrapX:
        options.wrapX !== undefined
          ? options.wrapX
          : source !== undefined
            ? source.getWrapX()
            : undefined,
    });

    const setReady = () => {
      this.projection =
        options.projection !== undefined
          ? getProjection(options.projection)
          : source !== undefined
            ? source.getProjection()
            : this.projection;
      this.tileGrid =
        options.tileGrid !== undefined
          ? options.tileGrid
          : source !== undefined
            ? source.getTileGrid()
            : this.tileGrid;
      this.zDirection =
        options.zDirection !== undefined
          ? options.zDirection
          : source !== undefined
            ? source.zDirection
            : this.zDirection;

      if (source instanceof DataTile) {
        this.transformMatrix = source.transformMatrix?.slice() || null;
      }

      const tileGrid = this.tileGrid;
      if (tileGrid) {
        this.setTileSizes(
          tileGrid
            .getResolutions()
            .map((r, i) =>
              toSize(tileGrid.getTileSize(i)).map((s) =>
                Math.max(Math.floor(s), 1),
              ),
            ),
        );
      }

      this.setLoader((z, x, y, loaderOptions) => {
        const text = renderXYZTemplate(template, z, x, y, loaderOptions.maxY);
        const [width, height] = this.getTileSize(z);
        const context = createCanvasContext2D(width, height);

        context.strokeStyle = 'grey';
        context.strokeRect(0.5, 0.5, width + 0.5, height + 0.5);

        context.fillStyle = 'grey';
        context.strokeStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '24px sans-serif';
        context.lineWidth = 4;
        context.strokeText(text, width / 2, height / 2, width);
        context.fillText(text, width / 2, height / 2, width);
        return context.canvas;
      });
      this.setState('ready');
    };

    if (source === undefined || source.getState() === 'ready') {
      setReady();
    } else {
      const handler = () => {
        if (source.getState() === 'ready') {
          source.removeEventListener(EventType.CHANGE, handler);
          setReady();
        }
      };
      source.addEventListener(EventType.CHANGE, handler);
    }
  }
}

export default TileDebug;
