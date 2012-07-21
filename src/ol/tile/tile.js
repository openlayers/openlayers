goog.provide('ol.Tile');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('ol.TileCoord');


/**
 * @enum {number}
 */
ol.TileLoadState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {string} src Source.
 * @param {string=} opt_crossOrigin Cross origin.
 */
ol.Tile = function(tileCoord, src, opt_crossOrigin) {

  goog.base(this);

  /**
   * @type {ol.TileCoord}
   */
  this.tileCoord = tileCoord;

  /**
   * @private
   * @type {string}
   */
  this.src_ = src;

  /**
   * @private
   * @type {ol.TileLoadState}
   */
  this.state_ = ol.TileLoadState.IDLE;

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
   * @type {Array.<number>}
   */
  this.imageListenerKeys_ = null;

};
goog.inherits(ol.Tile, goog.events.EventTarget);


/**
 * @protected
 */
ol.Tile.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @param {Object=} opt_context Object.
 * @return {Image} Image.
 */
ol.Tile.prototype.getImage = function(opt_context) {
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
 * @private
 */
ol.Tile.prototype.handleImageError_ = function() {
  this.state_ = ol.TileLoadState.ERROR;
  this.unlistenImage_();
};


/**
 * @private
 */
ol.Tile.prototype.handleImageLoad_ = function() {
  this.state_ = ol.TileLoadState.LOADED;
  this.unlistenImage_();
  this.dispatchChangeEvent();
};


/**
 * @return {boolean} Is loaded.
 */
ol.Tile.prototype.isLoaded = function() {
  return this.state_ == ol.TileLoadState.LOADED;
};


/**
 */
ol.Tile.prototype.load = function() {
  if (this.state_ == ol.TileLoadState.IDLE) {
    this.state_ = ol.TileLoadState.LOADING;
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
ol.Tile.prototype.unlistenImage_ = function() {
  goog.asserts.assert(!goog.isNull(this.imageListenerKeys_));
  goog.array.forEach(this.imageListenerKeys_, goog.events.unlistenByKey);
  this.imageListenerKeys_ = null;
};

