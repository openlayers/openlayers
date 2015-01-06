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
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 */
ol.ImageTile = function(tileCoord, state, src, crossOrigin, tileLoadFunction) {

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
   * @type {Array.<goog.events.Key>}
   */
  this.imageListenerKeys_ = null;

  /**
   * @private
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction_ = tileLoadFunction;

  /**
   * @private
   * @type {number}
   */
  this.sequenceNumber_ = 0;


  /**
   * @private
   * @type {ol.ImageTile}
   */
  this.outOfBandTile_ = null;

};
goog.inherits(ol.ImageTile, ol.Tile);


/**
 * set the url for the out-of-band tile
 *
 * @param {string} url The url to load out-of-band.
 * @return {ol.ImageTile}
 */
ol.ImageTile.prototype.setOutOfBandUrl = function(url) {
  if (this.outOfBandTile_ === null) {

    // create a new tile
    this.outOfBandTile_ = this.createOutOfBandTile_(url);
    this.assertSequence_();
    return this.outOfBandTile_;

  } else if (this.outOfBandTile_.state == ol.TileState.IDLE) {
    goog.asserts.assert(this.outOfBandTile_.outOfBandTile_ === null);

    // replace the old tile, and cause it to be dropped from the tile queue
    var newTile = this.createOutOfBandTile_(url);
    // this sets the tile load priority to DROP
    this.outOfBandTile_.tileCoord = [-1, 0, 0];
    this.outOfBandTile_ = newTile;
    this.assertSequence_();
    return this.outOfBandTile_;

  } else if (this.outOfBandTile_.state == ol.TileState.LOADING ||
      this.outOfBandTile_.state == ol.TileState.LOADED ||
      this.outOfBandTile_.state == ol.TileState.ERROR) {
    return this.outOfBandTile_.setOutOfBandUrl(url);
  } else {
    throw "don't know what to do when outOfBandTile is in state" +
        this.outOfBandTile_.state;
  }
};


/**
 * create the out-of-band tile
 *
 * @param {string} url The url to load out of band
 * @return {ol.ImageTile}
 * @private
 */
ol.ImageTile.prototype.createOutOfBandTile_ = function(url) {
  var tile = new ol.ImageTile(
      this.tileCoord,
      ol.TileState.IDLE,
      url,
      this.image_.crossOrigin === '' ? null : this.image_.crossOrigin,
      this.tileLoadFunction_);
  tile.sequenceNumber_ = this.getHighestSequenceNumber() + 1;
  return tile;
};


/**
 * get the out of band tile
 *
 * @return {ol.ImageTile}
 */
ol.ImageTile.prototype.getOutOfBandTile = function() {
  this.assertSequence_();
  return this.outOfBandTile_;
};


/**
 * update the out of band tile with a new tile
 *
 * @param {ol.ImageTile} tile The new tile
 */
ol.ImageTile.prototype.updateOutOfBandTile = function(tile) {
  if (tile.outOfBandTile_ !== null) {
    if (this.outOfBandTile_ === null) {
      if (this.sequenceNumber_ < tile.outOfBandTile_.sequenceNumber_) {
        this.outOfBandTile_ = tile.outOfBandTile_;
        this.assertSequence_();
      }
    } else if (this.outOfBandTile_.sequenceNumber_ <
        tile.outOfBandTile_.sequenceNumber_) {
      this.outOfBandTile_ = tile.outOfBandTile_;
      this.assertSequence_();
    }
  }
};


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
 * Gets the sequence number.
 *
 * @return {number} sequence number
 * @api
 */
ol.ImageTile.prototype.getSequenceNumber = function() {
  this.assertSequence_();
  return this.sequenceNumber_;
};


/**
 * Gets the highest sequence number of the tile, or its OOB tile, recursively
 *
 * @return {number}
 */
ol.ImageTile.prototype.getHighestSequenceNumber = function() {
  this.assertSequence_();
  if (this.outOfBandTile_ !== null) {
    return this.outOfBandTile_.getHighestSequenceNumber();
  } else {
    return this.sequenceNumber_;
  }
};


/**
 * Asserts that the sequence of tiles is correct
 *
 * @private
 */
ol.ImageTile.prototype.assertSequence_ = function() {
  if (this.outOfBandTile_ !== null) {
    goog.asserts.assert(this.outOfBandTile_.sequenceNumber_ >
        this.sequenceNumber_);
    this.outOfBandTile_.assertSequence_();
  }
};
