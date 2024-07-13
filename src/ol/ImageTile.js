/**
 * @module ol/ImageTile
 */
import Tile from './Tile.js';
import TileState from './TileState.js';
import {createCanvasContext2D} from './dom.js';
import {listenImage} from './Image.js';

class ImageTile extends Tile {
  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("./TileState.js").default} state State.
   * @param {string} src Image source URI.
   * @param {?string} crossOrigin Cross origin.
   * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
   * @param {import("./Tile.js").Options} [options] Tile options.
   */
  constructor(tileCoord, state, src, crossOrigin, tileLoadFunction, options) {
    super(tileCoord, state, options);

    /**
     * @private
     * @type {?string}
     */
    this.crossOrigin_ = crossOrigin;

    /**
     * Image URI
     *
     * @private
     * @type {string}
     */
    this.src_ = src;

    this.key = src;

    /**
     * @private
     * @type {HTMLImageElement|HTMLCanvasElement}
     */
    this.image_ = new Image();
    if (crossOrigin !== null) {
      this.image_.crossOrigin = crossOrigin;
    }

    /**
     * @private
     * @type {?function():void}
     */
    this.unlisten_ = null;

    /**
     * @private
     * @type {import("./Tile.js").LoadFunction}
     */
    this.tileLoadFunction_ = tileLoadFunction;
  }

  /**
   * Get the HTML image element for this tile (may be a Canvas, Image, or Video).
   * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
   * @api
   */
  getImage() {
    return this.image_;
  }

  /**
   * Sets an HTML image element for this tile (may be a Canvas or preloaded Image).
   * @param {HTMLCanvasElement|HTMLImageElement} element Element.
   */
  setImage(element) {
    this.image_ = element;
    this.state = TileState.LOADED;
    this.unlistenImage_();
    this.changed();
  }

  /**
   * Tracks loading or read errors.
   *
   * @private
   */
  handleImageError_() {
    this.state = TileState.ERROR;
    this.unlistenImage_();
    this.image_ = getBlankImage();
    this.changed();
  }

  /**
   * Tracks successful image load.
   *
   * @private
   */
  handleImageLoad_() {
    const image = /** @type {HTMLImageElement} */ (this.image_);
    if (image.naturalWidth && image.naturalHeight) {
      this.state = TileState.LOADED;
    } else {
      this.state = TileState.EMPTY;
    }
    this.unlistenImage_();
    this.changed();
  }

  /**
   * Load the image or retry if loading previously failed.
   * Loading is taken care of by the tile queue, and calling this method is
   * only needed for preloading or for reloading in case of an error.
   *
   * To retry loading tiles on failed requests, use a custom `tileLoadFunction`
   * that checks for error status codes and reloads only when the status code is
   * 408, 429, 500, 502, 503 and 504, and only when not too many retries have been
   * made already:
   *
   * ```js
   * const retryCodes = [408, 429, 500, 502, 503, 504];
   * const retries = {};
   * source.setTileLoadFunction((tile, src) => {
   *   const image = tile.getImage();
   *   fetch(src)
   *     .then((response) => {
   *       if (retryCodes.includes(response.status)) {
   *         retries[src] = (retries[src] || 0) + 1;
   *         if (retries[src] <= 3) {
   *           setTimeout(() => tile.load(), retries[src] * 1000);
   *         }
   *         return Promise.reject();
   *       }
   *       return response.blob();
   *     })
   *     .then((blob) => {
   *       const imageUrl = URL.createObjectURL(blob);
   *       image.src = imageUrl;
   *       setTimeout(() => URL.revokeObjectURL(imageUrl), 5000);
   *     })
   *     .catch(() => tile.setState(3)); // error
   * });
   * ```
   * @api
   * @override
   */
  load() {
    if (this.state == TileState.ERROR) {
      this.state = TileState.IDLE;
      this.image_ = new Image();
      if (this.crossOrigin_ !== null) {
        this.image_.crossOrigin = this.crossOrigin_;
      }
    }
    if (this.state == TileState.IDLE) {
      this.state = TileState.LOADING;
      this.changed();
      this.tileLoadFunction_(this, this.src_);
      this.unlisten_ = listenImage(
        this.image_,
        this.handleImageLoad_.bind(this),
        this.handleImageError_.bind(this),
      );
    }
  }

  /**
   * Discards event handlers which listen for load completion or errors.
   *
   * @private
   */
  unlistenImage_() {
    if (this.unlisten_) {
      this.unlisten_();
      this.unlisten_ = null;
    }
  }
}

/**
 * Get a 1-pixel blank image.
 * @return {HTMLCanvasElement} Blank image.
 */
function getBlankImage() {
  const ctx = createCanvasContext2D(1, 1);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 1, 1);
  return ctx.canvas;
}

export default ImageTile;
