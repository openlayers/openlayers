/**
 * @module ol/DataTile
 */
import Tile from './Tile.js';
import TileState from './TileState.js';
import {createCanvasContext2D} from './dom.js';
import {getArrayPixelData, getImagePixelData} from './pixel.js';

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
 * This is set as the cancellation reason when a tile is disposed.
 */
export const disposedError = new Error('disposed');

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
 * @property {function(): Promise<Array<Data>>} loader Data loader.  For loaders that generate images,
 * the promise should not resolve until the image is loaded.
 * @property {number} [transition=250] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @property {import('./size.js').Size} [size=[256, 256]] Tile size.
 * @property {AbortController} [controller] An abort controller.
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
     * @type {function(): Promise<Array<Data>>}
     * @private
     */
    this.loader_ = options.loader;

    /**
     * @type {Array<Data>}
     * @private
     */
    this.data_ = [];

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

    /**
     * @type {AbortController|null}
     * @private
     */
    this.controller_ = options.controller || null;
  }

  /**
   * Get the tile size.
   * @param {number} [slot=0] slot of the data.
   * @return {import('./size.js').Size} Tile size.
   */
  getSize(slot) {
    if (this.size_) {
      return this.size_;
    }
    const imageData = asImageLike(this.getData(slot));
    if (imageData) {
      return [imageData.width, imageData.height];
    }
    return defaultSize;
  }

  /**
   * Get the data for the tile.
   * @param {number} [slot=0] slot of the data.
   * @return {Data} Tile data.
   * @api
   */
  getData(slot) {
    return this.data_[slot ?? 0];
  }

  /**
   * @param {number} slot The slot number.
   * @return {number} The band count for the slot.
   */
  getBandCount(slot) {
    let data = this.getData(slot);
    if (asImageLike(data)) {
      return 4;
    }
    data = /** @type {ArrayLike} */ (data);
    const pixelSize = this.getSize(slot);
    const isFloat = data instanceof Float32Array;
    const DataType = isFloat ? Float32Array : Uint8Array;
    const bytesPerElement = DataType.BYTES_PER_ELEMENT;
    const bytesPerRow = data.byteLength / pixelSize[1];

    return Math.floor(bytesPerRow / bytesPerElement / pixelSize[0]);
  }

  /**
   * @param {number} renderCol The column index (in rendered tile space).
   * @param {number} renderRow The row index (in rendered tile space).
   * @param {import('./size.js').Size} renderSize The size of rendered tile.
   * @param {number} gutter The gutter.
   * @return {Uint8ClampedArray|Float32Array|null} The data.
   */
  getPixelDataAt(renderCol, renderRow, renderSize, gutter) {
    const slotArray = [...Array(this.getSlots())].map((_, i) => i);
    const dataArray = slotArray.map((slot) => this.getData(slot));
    const stride = slotArray.reduce(
      (acc, slot) => acc + this.getBandCount(slot),
      0,
    );
    const containsFloat = dataArray.some((x) => x instanceof Float32Array);
    const DataType = containsFloat ? Float32Array : Uint8ClampedArray;

    const result = new DataType(stride);
    let offset = 0;
    for (let slot = 0; slot < dataArray.length; slot++) {
      const data = dataArray[slot];
      if (!data) {
        return null;
      }

      const size = this.getSize(slot);
      const bandCount = this.getBandCount(slot);

      let pixelData;
      if (asImageLike(data)) {
        pixelData = getImagePixelData(
          asImageLike(data),
          renderCol,
          renderRow,
          renderSize,
          gutter,
        );
      } else {
        pixelData = getArrayPixelData(
          asArrayLike(data),
          bandCount,
          size,
          renderCol,
          renderRow,
          renderSize,
          gutter,
        );
      }

      if (!pixelData) {
        return null;
      }

      result.set(pixelData, offset);
      offset += bandCount;
    }
    return result;
  }

  /**
   * Get the number of slots.
   * @return {number} The number of slots.
   * @api
   */
  getSlots() {
    return this.data_.length;
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
   * Load the tile data.
   * @api
   * @override
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

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    if (this.controller_) {
      this.controller_.abort(disposedError);
      this.controller_ = null;
    }
    super.disposeInternal();
  }
}

export default DataTile;
