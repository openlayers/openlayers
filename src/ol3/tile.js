goog.provide('ol3.Tile');
goog.provide('ol3.TileState');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('ol3.TileCoord');


/**
 * @enum {number}
 */
ol3.TileState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @param {string} src Source.
 * @param {?string} crossOrigin Cross origin.
 */
ol3.Tile = function(tileCoord, src, crossOrigin) {

  goog.base(this);

  /**
   * @type {ol3.TileCoord}
   */
  this.tileCoord = tileCoord;

  /**
   * @private
   * @type {string}
   */
  this.src_ = src;

  /**
   * @private
   * @type {ol3.TileState}
   */
  this.state_ = ol3.TileState.IDLE;

  /**
   * @private
   * @type {Image}
   */
  this.image_ = new Image();
  if (!goog.isNull(crossOrigin)) {
    this.image_.crossOrigin = crossOrigin;
  }

  /**
   * @private
   * @type {Object.<number, Image>}
   */
  this.imageByContext_ = {};

  /**
   * @private
   * @type {Array.<number>}
   */
  this.imageListenerKeys_ = null;

};
goog.inherits(ol3.Tile, goog.events.EventTarget);


/**
 * @protected
 */
ol3.Tile.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @param {Object=} opt_context Object.
 * @return {Image} Image.
 */
ol3.Tile.prototype.getImage = function(opt_context) {
  if (goog.isDef(opt_context)) {
    var image;
    var key = goog.getUid(opt_context);
    if (key in this.imageByContext_) {
      return this.imageByContext_[key];
    } else if (goog.object.isEmpty(this.imageByContext_)) {
      image = this.image_;
    } else {
      image = /** @type {Image} */ this.image_.cloneNode(false);
    }
    this.imageByContext_[key] = image;
    return image;
  } else {
    return this.image_;
  }
};


/**
 * @return {ol3.TileState} State.
 */
ol3.Tile.prototype.getState = function() {
  return this.state_;
};


/**
 * @private
 */
ol3.Tile.prototype.handleImageError_ = function() {
  this.state_ = ol3.TileState.ERROR;
  this.unlistenImage_();
};


/**
 * @private
 */
ol3.Tile.prototype.handleImageLoad_ = function() {
  this.state_ = ol3.TileState.LOADED;
  this.unlistenImage_();
  this.dispatchChangeEvent();
};


/**
 * Load.
 */
ol3.Tile.prototype.load = function() {
  if (this.state_ == ol3.TileState.IDLE) {
    this.state_ = ol3.TileState.LOADING;
    goog.asserts.assert(goog.isNull(this.imageListenerKeys_));
    this.imageListenerKeys_ = [
      goog.events.listenOnce(this.image_, goog.events.EventType.ERROR,
          this.handleImageError_, false, this),
      goog.events.listenOnce(this.image_, goog.events.EventType.LOAD,
          this.handleImageLoad_, false, this)
    ];
    this.image_.src = this.src_;
  }
};


/**
 * @private
 */
ol3.Tile.prototype.unlistenImage_ = function() {
  goog.asserts.assert(!goog.isNull(this.imageListenerKeys_));
  goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};

