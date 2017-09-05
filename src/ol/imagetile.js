import _ol_ from './index';
import _ol_Tile_ from './tile';
import _ol_TileState_ from './tilestate';
import _ol_dom_ from './dom';
import _ol_events_ from './events';
import _ol_events_EventType_ from './events/eventtype';

/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 */
var _ol_ImageTile_ = function(tileCoord, state, src, crossOrigin, tileLoadFunction) {

  _ol_Tile_.call(this, tileCoord, state);

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

_ol_.inherits(_ol_ImageTile_, _ol_Tile_);


/**
 * @inheritDoc
 */
_ol_ImageTile_.prototype.disposeInternal = function() {
  if (this.state == _ol_TileState_.LOADING) {
    this.unlistenImage_();
    this.image_.src = _ol_ImageTile_.blankImageUrl;
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
  this.image_.src = _ol_ImageTile_.blankImageUrl;
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
  if (this.state == _ol_TileState_.IDLE || this.state == _ol_TileState_.ERROR) {
    this.state = _ol_TileState_.LOADING;
    this.changed();
    this.imageListenerKeys_ = [
      _ol_events_.listenOnce(this.image_, _ol_events_EventType_.ERROR,
          this.handleImageError_, this),
      _ol_events_.listenOnce(this.image_, _ol_events_EventType_.LOAD,
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
 * Data URI for a blank image.
 * @type {string}
 */
_ol_ImageTile_.blankImageUrl = (function() {
  var ctx = _ol_dom_.createCanvasContext2D(1, 1);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 1, 1);
  return ctx.canvas.toDataURL('image/png');
})();
export default _ol_ImageTile_;
