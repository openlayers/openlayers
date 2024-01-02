/**
 * @module ol/DataTile
 */
import Tile from './Tile.js';
import TileState from './TileState.js';
import {createCanvasContext2D} from './dom.js';

/**
 * @typedef {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} ImageLike
 */

/**
 * @typedef {Uint8Array|Uint8ClampedArray|Float32Array|DataView} ArrayLike
 */

/**
 * Data that can be used with a DataTile.
 * @typedef {ArrayLike|ImageLike} Data
 */

/**
 * @param {Data} data Tile data.
 * @return {ImageLike|null} The image-like data.
 */
export function asImageLike(data) {
  return data instanceof Image ||
    data instanceof HTMLCanvasElement ||
    data instanceof HTMLVideoElement ||
    data instanceof ImageBitmap
    ? data
    : null;
}

/**
 * @param {Data} data Tile data.
 * @return {ArrayLike|null} The array-like data.
 */
export function asArrayLike(data) {
  return data instanceof Uint8Array ||
    data instanceof Uint8ClampedArray ||
    data instanceof Float32Array ||
    data instanceof DataView
    ? data
    : null;
}

/**
 * @type {CanvasRenderingContext2D|null}
 */
let sharedContext = null;

/**
 * @param {ImageLike} image The image.
 * @return {Uint8ClampedArray} The data.
 */
export function toArray(image) {
  if (!sharedContext) {
    sharedContext = createCanvasContext2D(
      image.width,
      image.height,
      undefined,
      {willReadFrequently: true},
    );
  }
  const canvas = sharedContext.canvas;
  const width = image.width;
  if (canvas.width !== width) {
    canvas.width = width;
  }
  const height = image.height;
  if (canvas.height !== height) {
    canvas.height = height;
  }
  sharedContext.clearRect(0, 0, width, height);
  sharedContext.drawImage(image, 0, 0);
  return sharedContext.getImageData(0, 0, width, height).data;
}

/**
 * @type {import('./size.js').Size}
 */
const defaultSize = [256, 256];

/**
 * @typedef {Object} Options
 * @property {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @property {function(): Promise<Data>} loader Data loader.  For loaders that generate images,
 * the promise should not resolve until the image is loaded.
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
     * @type {import('./size.js').Size|null}
     * @private
     */
    this.size_ = options.size || null;
  }

  /**
   * Get the tile size.
   * @return {import('./size.js').Size} Tile size.
   */
  getSize() {
    if (this.size_) {
      return this.size_;
    }
    const imageData = asImageLike(this.data_);
    if (imageData) {
      return [imageData.width, imageData.height];
    }
    return defaultSize;
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
