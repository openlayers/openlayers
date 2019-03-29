/**
 * @module ol/ImageTile
 */
import Tile from './Tile.js';
import TileState from './TileState.js';
import {createCanvasContext2D} from './dom.js';
import {listenOnce, unlistenByKey} from './events.js';
import EventType from './events/EventType.js';


class ImageTile extends Tile {

  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {TileState} state State.
   * @param {string} src Image source URI.
   * @param {?string} crossOrigin Cross origin.
   * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
   * @param {import("./Tile.js").Options=} opt_options Tile options.
   */
  constructor(tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options) {

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
     * @type {Array<import("./events.js").EventsKey>}
     */
    this.imageListenerKeys_ = null;

    /**
     * @private
     * @type {import("./Tile.js").LoadFunction}
     */
    this.tileLoadFunction_ = tileLoadFunction;

  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    if (this.state == TileState.LOADING) {
      this.unlistenImage_();
      this.image_ = getBlankImage();
    }
    if (this.interimTile) {
      this.interimTile.dispose();
    }
    this.state = TileState.ABORT;
    this.changed();
    super.disposeInternal();
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
   * @inheritDoc
   */
  getKey() {
    return this.src_;
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
   * @inheritDoc
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
      this.imageListenerKeys_ = [
        listenOnce(this.image_, EventType.ERROR,
          this.handleImageError_, this),
        listenOnce(this.image_, EventType.LOAD,
          this.handleImageLoad_, this)
      ];
      this.tileLoadFunction_(this, this.src_);
    }
  }

  /**
   * Discards event handlers which listen for load completion or errors.
   *
   * @private
   */
  unlistenImage_() {
    this.imageListenerKeys_.forEach(unlistenByKey);
    this.imageListenerKeys_ = null;
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
