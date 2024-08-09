/**
 * @module ol/source/ColorTile
 */

import DataTileSource from './DataTile.js';
import {createCanvasContext2D} from '../dom.js';

/**
 * @typedef {Object} Options
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {number} [transition=0] Transition time when fading in new tiles (in milliseconds).
 * @property {string} [color='black'] Color for the tiles.
 */

/**
 * @classdesc
 * A pseudo tile source, which does not fetch tiles from a server, but renders
 * a simple color tile instead.
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

    super({
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      interpolate: false,
      transition: options.transition ?? 0,
      tileSize,

      projection: null, // must never be reprojected

      loader: () => {
        return this.context_.canvas;
      },
    });

    this.color_;
    this.context_ = createCanvasContext2D(tileSize[0], tileSize[1]);
    this.setColor(options.color ?? 'black');
  }

  /**
   * Return the color for all tiles.
   * @return {string} The color for all tiles.
   * @api
   */
  getColor() {
    return this.color_;
  }

  /**
   * Set the color for all tiles in the source.
   * @param {string} color The color for tiles.
   * @api
   */
  setColor(color) {
    this.color_ = color;

    this.context_.clearRect(
      0,
      0,
      this.context_.canvas.width,
      this.context_.canvas.height,
    );
    this.context_.fillStyle = this.color_;
    this.context_.fillRect(
      0,
      0,
      this.context_.canvas.width,
      this.context_.canvas.height,
    );

    this.setKey('color-tile:' + this.color_);
    this.changed();
  }
}

export default ColorTileSource;
