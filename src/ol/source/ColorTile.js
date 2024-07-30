/**
 * @module ol/source/ColorTile
 */

import DataTileSource from './DataTile.js';
import {createCanvasContext2D} from '../dom.js';

const Property = {
  COLOR: 'color',
};

/**
 * @typedef {Object} Options
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number} [transition=0] Transition time when fading in new tiles (in milliseconds).
 * @property {string} [color='black'] Color for the tiles.
 */

/**
 * @classdesc
 * A pseudo tile source, which does not fetch tiles from a server, but renders
 * simple color tiles instead.
 * @api
 */
class ColorTileSource extends DataTileSource {
  /**
   * @param {Options} [options] Color tile options.
   */
  constructor(options) {
    /**
     * @type {Options}
     */
    options = options || {};

    const tileSize = [256, 256];

    const context = createCanvasContext2D(tileSize[0], tileSize[1]);

    super({
      wrapX: options.wrapX ?? true,
      interpolate: false,
      transition: options.transition ?? 0,
      tileSize,

      projection: null,
      tileGrid: null,

      loader: () => {
        return context.canvas;
      },
    });

    this.setColorCallback_ = () => {
      const color = this.getColor();

      context.fillStyle = color;
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);

      this.setKey('color-tile:' + color);
      this.changed();
    };

    this.addChangeListener(Property.COLOR, this.setColorCallback_);
    this.setColor(options.color ?? 'black');
  }

  /**
   * Return the color for all tiles.
   * @return {string} The color for all tiles.
   * @api
   */
  getColor() {
    return this.get(Property.COLOR);
  }

  /**
   * Set the color for all tiles in the source.
   * @param {string} color The color for all tiles.
   * @api
   */
  setColor(color) {
    this.set(Property.COLOR, color);
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} viewProjection Projection.
   * @return {import("../DataTile.js").default|null} Tile (or null if outside source extent).
   * @override
   */
  getTile(z, x, y, pixelRatio, viewProjection) {
    // always use view projection
    this.projection = viewProjection;
    return super.getTile(z, x, y, pixelRatio, viewProjection);
  }

  /**
   * Clean up
   * @override
   */
  disposeInternal() {
    super.disposeInternal();

    this.removeChangeListener(Property.COLOR, this.setColorCallback_);
  }
}

export default ColorTileSource;
