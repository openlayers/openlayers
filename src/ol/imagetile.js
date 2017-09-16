goog.provide('ol.ImageTile');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.events.EventType');


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
ol.ImageTile = function(tileCoord, state, src, crossOrigin, tileLoadFunction, opt_options) {

  ol.Tile.call(this, tileCoord, state, opt_options);

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
ol.inherits(ol.ImageTile, ol.Tile);


/**
 * @inheritDoc
 */
ol.ImageTile.prototype.disposeInternal = function() {
  if (this.state == ol.TileState.LOADING) {
    this.unlistenImage_();
    this.image_.src = ol.ImageTile.blankImageUrl;
  }
  if (this.interimTile) {
    this.interimTile.dispose();
  }
  this.state = ol.TileState.ABORT;
  this.changed();
  ol.Tile.prototype.disposeInternal.call(this);
};


/**
 * Get the HTML image element for this tile (may be a Canvas, Image, or Video).
 * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
 * @api
 */
ol.ImageTile.prototype.getImage = function() {
  return this.image_;
};


/**
 * @inheritDoc
 */
ol.ImageTile.prototype.getKey = function() {
  return this.src_;
};


/**
 * Tracks loading or read errors.
 *
 * @private
 */
ol.ImageTile.prototype.handleImageError_ = function() {
  this.state = ol.TileState.ERROR;
  this.unlistenImage_();
  this.image_.src = ol.ImageTile.blankImageUrl;
  this.changed();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
ol.ImageTile.prototype.handleImageLoad_ = function() {
  if (this.image_.naturalWidth && this.image_.naturalHeight) {
    this.state = ol.TileState.LOADED;
  } else {
    this.state = ol.TileState.EMPTY;
  }
  this.unlistenImage_();
  this.changed();
};


/**
 * @inheritDoc
 * @api
 */
ol.ImageTile.prototype.load = function() {
  if (this.state == ol.TileState.IDLE || this.state == ol.TileState.ERROR) {
    this.state = ol.TileState.LOADING;
    this.changed();
    this.imageListenerKeys_ = [
      ol.events.listenOnce(this.image_, ol.events.EventType.ERROR,
          this.handleImageError_, this),
      ol.events.listenOnce(this.image_, ol.events.EventType.LOAD,
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
ol.ImageTile.prototype.unlistenImage_ = function() {
  this.imageListenerKeys_.forEach(ol.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};


/**
 * Data URI for a blank image.
 * @type {string}
 */
ol.ImageTile.blankImageUrl = (function() {
  var ctx = ol.dom.createCanvasContext2D(1, 1);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 1, 1);
  return ctx.canvas.toDataURL('image/png');
})();
