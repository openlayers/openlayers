goog.provide('ol.ImageTile');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.events');
goog.require('ol.events.EventType');


/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Tile.State} state State.
 * @param {string} src Image source URI.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 */
ol.ImageTile = function(tileCoord, state, src, crossOrigin, tileLoadFunction) {

  ol.Tile.call(this, tileCoord, state);

  /**
   * Image URI
   *
   * @private
   * @type {string}
   */
  this.src_ = src;

  /**
   * @private
   * @type {Image}
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
  if (this.state == ol.Tile.State.LOADING) {
    this.unlistenImage_();
  }
  if (this.interimTile) {
    this.interimTile.dispose();
  }
  this.state = ol.Tile.State.ABORT;
  this.changed();
  ol.Tile.prototype.disposeInternal.call(this);
};


/**
 * Get the image element for this tile.
 * @inheritDoc
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
  this.state = ol.Tile.State.ERROR;
  this.unlistenImage_();
  this.changed();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
ol.ImageTile.prototype.handleImageLoad_ = function() {
  if (this.image_.naturalWidth && this.image_.naturalHeight) {
    this.state = ol.Tile.State.LOADED;
  } else {
    this.state = ol.Tile.State.EMPTY;
  }
  this.unlistenImage_();
  this.changed();
};


/**
 * Load the image or retry if loading previously failed.
 * Loading is taken care of by the tile queue, and calling this method is
 * only needed for preloading or for reloading in case of an error.
 * @api
 */
ol.ImageTile.prototype.load = function() {
  if (this.state == ol.Tile.State.IDLE || this.state == ol.Tile.State.ERROR) {
    this.state = ol.Tile.State.LOADING;
    this.changed();
    ol.DEBUG && console.assert(!this.imageListenerKeys_,
        'this.imageListenerKeys_ should be null');
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
