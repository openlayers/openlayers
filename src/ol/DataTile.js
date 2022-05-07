/**
 * @module ol/DataTile
 */
import Tile from './Tile.js';
import TileState from './TileState.js';

/**
 * Data that can be used with a DataTile.  For increased browser compatibility, use
 * Uint8Array instead of Uint8ClampedArray where possible.
 * @typedef {Uint8Array|Uint8ClampedArray|Float32Array|DataView} Data
 */

/**
 * @typedef {Object} Options
 * @property {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @property {function(): Promise<Data>} loader Data loader.
 * @property {number} [transition=250] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @property {import('./size.js').Size} [size=[256, 256]] Tile size.
 * @api
 */

class DataTile extends Tile {
  /**
   * @param {Options} options Tile options.
   */
  constructor(options) {
    const state = TileState.IDLE;

    super(options.tileCoord, state, {
      transition: options.transition,
      interpolate: options.interpolate,
    });

    /**
     * @type {function(): Promise<Data>}
     * @private
     */
    this.loader_ = options.loader;

    /**
     * @type {Data}
     * @private
     */
    this.data_ = null;

    /**
     * @type {Error}
     * @private
     */
    this.error_ = null;

    /**
     * @type {import('./size.js').Size}
     * @private
     */
    this.size_ = options.size || [256, 256];
  }

  /**
   * Get the tile size.
   * @return {import('./size.js').Size} Tile size.
   */
  getSize() {
    return this.size_;
  }

  /**
   * Get the data for the tile.
   * @return {Data} Tile data.
   * @api
   */
  getData() {
    return this.data_;
  }

  /**
   * Get any loading error.
   * @return {Error} Loading error.
   * @api
   */
  getError() {
    return this.error_;
  }

  /**
   * Load not yet loaded URI.
   * @api
   */
  load() {
    if (this.state !== TileState.IDLE && this.state !== TileState.ERROR) {
      return;
    }
    this.state = TileState.LOADING;
    this.changed();

    const self = this;
    this.loader_()
      .then(function (data) {
        self.data_ = data;
        self.state = TileState.LOADED;
        self.changed();
      })
      .catch(function (error) {
        self.error_ = error;
        self.state = TileState.ERROR;
        self.changed();
      });
  }
}

export default DataTile;
