goog.provide('ol.ImageTile');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileLoadFunctionType');
goog.require('ol.TileState');



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @param {ol.TileLoadFunctionType=} opt_tileLoadFunction Tile load function.
 * @param {string=} opt_crossOrigin Cross origin.
 */
ol.ImageTile = function(
    tileCoord, state, src, opt_tileLoadFunction, opt_crossOrigin) {

  goog.base(this, tileCoord, state);

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
  if (goog.isDef(opt_crossOrigin)) {
    this.image_.crossOrigin = opt_crossOrigin;
  }

  /**
   * @private
   * @type {Object.<number, Image>}
   */
  this.imageByContext_ = {};

  /**
   * @private
   * @type {Array.<goog.events.Key>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @private
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction_ = goog.isDef(opt_tileLoadFunction) ?
      opt_tileLoadFunction : ol.ImageTile.defaultTileLoadFunction;

};
goog.inherits(ol.ImageTile, ol.Tile);


/**
 * @inheritDoc
 */
ol.ImageTile.prototype.disposeInternal = function() {
  if (this.state == ol.TileState.LOADING) {
    this.unlistenImage_();
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 * @api
 */
ol.ImageTile.prototype.getImage = function(opt_context) {
  if (goog.isDef(opt_context)) {
    var image;
    var key = goog.getUid(opt_context);
    if (key in this.imageByContext_) {
      return this.imageByContext_[key];
    } else if (goog.object.isEmpty(this.imageByContext_)) {
      image = this.image_;
    } else {
      image = /** @type {Image} */ (this.image_.cloneNode(false));
    }
    this.imageByContext_[key] = image;
    return image;
  } else {
    return this.image_;
  }
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
  this.changed();
};


/**
 * Tracks successful image load.
 *
 * @private
 */
ol.ImageTile.prototype.handleImageLoad_ = function() {
  if (ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE) {
    if (!goog.isDef(this.image_.naturalWidth)) {
      this.image_.naturalWidth = this.image_.width;
      this.image_.naturalHeight = this.image_.height;
    }
  }

  if (this.image_.naturalWidth && this.image_.naturalHeight) {
    this.state = ol.TileState.LOADED;
  } else {
    this.state = ol.TileState.EMPTY;
  }
  this.unlistenImage_();
  this.changed();
};


/**
 * Load not yet loaded URI.
 */
ol.ImageTile.prototype.load = function() {
  if (this.state == ol.TileState.IDLE) {
    this.state = ol.TileState.LOADING;
    this.changed();
    goog.asserts.assert(goog.isNull(this.imageListenerKeys_),
        'this.imageListenerKeys_ should be null');
    this.imageListenerKeys_ = [
      goog.events.listenOnce(this.image_, goog.events.EventType.ERROR,
          this.handleImageError_, false, this),
      goog.events.listenOnce(this.image_, goog.events.EventType.LOAD,
          this.handleImageLoad_, false, this)
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
  goog.asserts.assert(!goog.isNull(this.imageListenerKeys_),
      'this.imageListenerKeys_ should not be null');
  goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};


/**
 * @param {ol.ImageTile} imageTile Image tile.
 * @param {string} src Source.
 */
ol.ImageTile.defaultTileLoadFunction = function(imageTile, src) {
  imageTile.getImage().src = src;
};
