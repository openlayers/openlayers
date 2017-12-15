/**
 * @module ol/ImageTile
 */
import {inherits} from './index.js';
import _ol_Tile_ from './Tile.js';
import _ol_TileState_ from './TileState.js';
import {createCanvasContext2D} from './dom.js';
import _ol_events_ from './events.js';
import EventType from './events/EventType.js';

/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @param {olx.TileOptions=} opt_options Tile options.
 */
var _ol_ImageTile_ = function(tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options) {

  _ol_Tile_.call(this, tileCoord, state, opt_options);

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
   * @type {Array.<ol.EventsKey>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @private
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction_ = tileLoadFunction;

};

inherits(_ol_ImageTile_, _ol_Tile_);


/**
 * @inheritDoc
 */
_ol_ImageTile_.prototype.disposeInternal = function() {
  if (this.state == _ol_TileState_.LOADING) {
    this.unlistenImage_();
    this.image_ = _ol_ImageTile_.getBlankImage();
  }
  if (this.interimTile) {
    this.interimTile.dispose();
  }
  this.state = _ol_TileState_.ABORT;
  this.changed();
  _ol_Tile_.prototype.disposeInternal.call(this);
};


/**
 * Get the HTML image element for this tile (may be a Canvas, Image, or Video).
 * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
 * @api
 */
_ol_ImageTile_.prototype.getImage = function() {
  return this.image_;
};


/**
 * @inheritDoc
 */
_ol_ImageTile_.prototype.getKey = function() {
  return this.src_;
};


/**
 * Tracks loading or read errors.
 *
 * @private
 */
_ol_ImageTile_.prototype.handleImageError_ = function() {
  this.state = _ol_TileState_.ERROR;
  this.unlistenImage_();
  this.image_ = _ol_ImageTile_.getBlankImage();
  this.changed();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
_ol_ImageTile_.prototype.handleImageLoad_ = function() {
  if (this.image_.naturalWidth && this.image_.naturalHeight) {
    this.state = _ol_TileState_.LOADED;
  } else {
    this.state = _ol_TileState_.EMPTY;
  }
  this.unlistenImage_();
  this.changed();
};


/**
 * @inheritDoc
 * @api
 */
_ol_ImageTile_.prototype.load = function() {
  if (this.state == _ol_TileState_.ERROR) {
    this.state = _ol_TileState_.IDLE;
    this.image_ = new Image();
    if (this.crossOrigin_ !== null) {
      this.image_.crossOrigin = this.crossOrigin_;
    }
  }
  if (this.state == _ol_TileState_.IDLE) {
    this.state = _ol_TileState_.LOADING;
    this.changed();
    this.imageListenerKeys_ = [
      _ol_events_.listenOnce(this.image_, EventType.ERROR,
          this.handleImageError_, this),
      _ol_events_.listenOnce(this.image_, EventType.LOAD,
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
_ol_ImageTile_.prototype.unlistenImage_ = function() {
  this.imageListenerKeys_.forEach(_ol_events_.unlistenByKey);
  this.imageListenerKeys_ = null;
};


/**
 * Get a 1-pixel blank image.
 * @return {HTMLCanvasElement} Blank image.
 */
_ol_ImageTile_.getBlankImage = function() {
  var ctx = createCanvasContext2D(1, 1);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 1, 1);
  return ctx.canvas;
};
export default _ol_ImageTile_;
