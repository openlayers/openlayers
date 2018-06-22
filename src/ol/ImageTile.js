/**
 * @module ol/ImageTile
 */
import {inherits} from './util.js';
import Tile from './Tile.js';
import TileState from './TileState.js';
import {createCanvasContext2D} from './dom.js';
import {listenOnce, unlistenByKey} from './events.js';
import EventType from './events/EventType.js';

/**
 * @typedef {function(new: module:ol/ImageTile, module:ol/tilecoord~TileCoord,
 * module:ol/TileState, string, ?string, module:ol/Tile~LoadFunction)} TileClass
 * @api
 */

/**
 * @constructor
 * @extends {module:ol/Tile}
 * @param {module:ol/tilecoord~TileCoord} tileCoord Tile coordinate.
 * @param {module:ol/TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {module:ol/Tile~LoadFunction} tileLoadFunction Tile load function.
 * @param {module:ol/Tile~Options=} opt_options Tile options.
 */
const ImageTile = function(tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options) {

  Tile.call(this, tileCoord, state, opt_options);

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
   * @type {Image|HTMLCanvasElement}
   */
  this.image_ = new Image();
  if (crossOrigin !== null) {
    this.image_.crossOrigin = crossOrigin;
  }

  /**
   * @private
   * @type {Array.<module:ol/events~EventsKey>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @private
   * @type {module:ol/Tile~LoadFunction}
   */
  this.tileLoadFunction_ = tileLoadFunction;

};

inherits(ImageTile, Tile);


/**
 * @inheritDoc
 */
ImageTile.prototype.disposeInternal = function() {
  if (this.state == TileState.LOADING) {
    this.unlistenImage_();
    this.image_ = getBlankImage();
  }
  if (this.interimTile) {
    this.interimTile.dispose();
  }
  this.state = TileState.ABORT;
  this.changed();
  Tile.prototype.disposeInternal.call(this);
};


/**
 * Get the HTML image element for this tile (may be a Canvas, Image, or Video).
 * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
 * @api
 */
ImageTile.prototype.getImage = function() {
  return this.image_;
};


/**
 * @inheritDoc
 */
ImageTile.prototype.getKey = function() {
  return this.src_;
};


/**
 * Tracks loading or read errors.
 *
 * @private
 */
ImageTile.prototype.handleImageError_ = function() {
  this.state = TileState.ERROR;
  this.unlistenImage_();
  this.image_ = getBlankImage();
  this.changed();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
ImageTile.prototype.handleImageLoad_ = function() {
  if (this.image_.naturalWidth && this.image_.naturalHeight) {
    this.state = TileState.LOADED;
  } else {
    this.state = TileState.EMPTY;
  }
  this.unlistenImage_();
  this.changed();
};


/**
 * @inheritDoc
 * @api
 */
ImageTile.prototype.load = function() {
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
};


/**
 * Discards event handlers which listen for load completion or errors.
 *
 * @private
 */
ImageTile.prototype.unlistenImage_ = function() {
  this.imageListenerKeys_.forEach(unlistenByKey);
  this.imageListenerKeys_ = null;
};


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
