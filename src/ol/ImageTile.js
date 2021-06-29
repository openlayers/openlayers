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
   * @param {import("./Tile.js").Options} [opt_options] Tile options.
   */
  constructor(
    tileCoord,
    state,
    src,
    crossOrigin,
    tileLoadFunction,
    opt_options
  ) {
    super(tileCoord, state, opt_options);

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
   * Load not yet loaded URI.
   * @api
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
        this.handleImageError_.bind(this)
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
