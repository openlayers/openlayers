goog.provide('ol.TileGrid');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math.Size');
goog.require('ol.Extent');
goog.require('ol.TileBounds');
goog.require('ol.TileCoord');



/**
 * @constructor
 * @param {!Array.<number>} resolutions Resolutions.
 * @param {ol.Extent} extent Extent.
 * @param {goog.math.Coordinate|!Array.<goog.math.Coordinate>} origin Origin.
 * @param {boolean=} opt_xEast Tile coordinates increase eastwards.
 * @param {boolean=} opt_ySouth Tile coordinates increas southwards.
 * @param {goog.math.Size=} opt_tileSize Tile size.
 */
ol.TileGrid =
    function(resolutions, extent, origin, opt_xEast, opt_ySouth, opt_tileSize) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.resolutions_ = resolutions;
  goog.asserts.assert(goog.array.isSorted(resolutions, function(a, b) {
    return -goog.array.defaultCompare(a, b);
  }, true));

  /**
   * @private
   * @type {number}
   */
  this.numResolutions_ = this.resolutions_.length;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = extent;

  /**
   * @private
   * @type {boolean}
   */
  this.xEast_ = goog.isDef(opt_xEast) ? opt_xEast : true;

  /**
   * @private
   * @type {boolean}
   */
  this.ySouth_ = goog.isDef(opt_ySouth) ? opt_ySouth : true;

  /**
   * @private
   * @type {goog.math.Coordinate}
   */
  this.origin_ = null;

  /**
   * @private
   * @type {Array.<goog.math.Coordinate>}
   */
  this.origins_ = null;

  if (origin instanceof goog.math.Coordinate) {
    this.origin_ = origin;
  } else if (goog.isArray(origin)) {
    goog.asserts.assert(origin.length == this.numResolutions_);
    this.origins_ = origin;
  } else {
    goog.asserts.assert(false);
  }

  /**
   * @private
   * @type {goog.math.Size}
   */
  this.tileSize_ = goog.isDef(opt_tileSize) ?
      opt_tileSize : new goog.math.Size(256, 256);

};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {function(number, ol.TileBounds): boolean} callback Callback.
 */
ol.TileGrid.prototype.forEachTileCoordParent = function(tileCoord, callback) {
  var tileCoordExtent = this.getTileCoordExtent(tileCoord);
  var z = tileCoord.z - 1;
  while (z >= 0) {
    if (callback(z, this.getExtentTileBounds(z, tileCoordExtent))) {
      return;
    }
    --z;
  }
};


/**
 * @return {ol.Extent} Extent.
 */
ol.TileGrid.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @param {number} z Z.
 * @param {ol.Extent} extent Extent.
 * @return {ol.TileBounds} Tile bounds.
 */
ol.TileGrid.prototype.getExtentTileBounds = function(z, extent) {
  var topRight = new goog.math.Coordinate(extent.right, extent.top);
  var bottomLeft = new goog.math.Coordinate(extent.left, extent.bottom);
  return ol.TileBounds.boundingTileBounds(
      this.getTileCoord(z, topRight),
      this.getTileCoord(z, bottomLeft));
};


/**
 * @return {number} Maximum resolution.
 */
ol.TileGrid.prototype.getMaxResolution = function() {
  return this.getResolutions()[0];
};


/**
 * @param {number} z Z.
 * @return {goog.math.Coordinate} Origin.
 */
ol.TileGrid.prototype.getOrigin = function(z) {
  if (!goog.isNull(this.origin_)) {
    return this.origin_;
  } else {
    goog.asserts.assert(!goog.isNull(this.origins_));
    goog.asserts.assert(0 <= z && z < this.origins_.length);
    return this.origins_[z];
  }
};


/**
 * @param {number} z Z.
 * @return {number} Resolution.
 */
ol.TileGrid.prototype.getResolution = function(z) {
  goog.asserts.assert(0 <= z && z < this.numResolutions_);
  return this.resolutions_[z];
};


/**
 * @return {Array.<number>} Resolutions.
 */
ol.TileGrid.prototype.getResolutions = function() {
  return this.resolutions_;
};


/**
 * @param {number} z Z.
 * @param {goog.math.Coordinate} coordinate Coordinate.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.TileGrid.prototype.getTileCoord = function(z, coordinate) {
  var origin = this.getOrigin(z);
  var resolution = this.getResolution(z);
  var tileSize = this.getTileSize();
  var x;
  if (this.xEast_) {
    x = Math.floor((coordinate.x - origin.x) / (tileSize.width * resolution));
  } else {
    x = Math.floor((origin.x - coordinate.x) / (tileSize.width * resolution));
  }
  var y;
  if (this.ySouth_) {
    y = Math.floor((origin.y - coordinate.y) / (tileSize.height * resolution));
  } else {
    y = Math.floor((coordinate.y - origin.y) / (tileSize.height * resolution));
  }
  return new ol.TileCoord(z, x, y);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {goog.math.Coordinate} Tile center.
 */
ol.TileGrid.prototype.getTileCoordCenter = function(tileCoord) {
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.tileSize_;
  var x;
  if (this.xEast_) {
    x = origin.x + (tileCoord.x + 0.5) * tileSize.width * resolution;
  } else {
    x = origin.x - (tileCoord.x + 0.5) * tileSize.width * resolution;
  }
  var y;
  if (this.ySouth_) {
    y = origin.y - (tileCoord.y + 0.5) * tileSize.height * resolution;
  } else {
    y = origin.y + (tileCoord.y + 0.5) * tileSize.height * resolution;
  }
  return new goog.math.Coordinate(x, y);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {ol.Extent} Extent.
 */
ol.TileGrid.prototype.getTileCoordExtent = function(tileCoord) {
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.tileSize_;
  var left, right;
  if (this.xEast_) {
    left = origin.x + tileCoord.x * tileSize.width * resolution;
    right = left + tileSize.width * resolution;
  } else {
    right = origin.x - tileCoord.x * tileSize.width * resolution;
    left = right - tileSize.height * resolution;
  }
  var top, bottom;
  if (this.ySouth_) {
    top = origin.y - tileCoord.y * tileSize.height * resolution;
    bottom = top - tileSize.height * resolution;
  } else {
    bottom = origin.y + tileCoord.y * tileSize.height * resolution;
    top = bottom + tileSize.height * resolution;
  }
  return new ol.Extent(top, right, bottom, left);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {number} Tile resolution.
 */
ol.TileGrid.prototype.getTileCoordResolution = function(tileCoord) {
  goog.asserts.assert(0 <= tileCoord.z && tileCoord.z < this.numResolutions_);
  return this.resolutions_[tileCoord.z];
};


/**
 * @return {goog.math.Size} Tile size.
 */
ol.TileGrid.prototype.getTileSize = function() {
  return this.tileSize_;
};


/**
 * @return {boolean} X East.
 */
ol.TileGrid.prototype.getXEast = function() {
  return this.xEast_;
};


/**
 * @return {boolean} Y South.
 */
ol.TileGrid.prototype.getYSouth = function() {
  return this.ySouth_;
};


/**
 * @param {number} resolution Resolution.
 * @return {number} Z.
 */
ol.TileGrid.prototype.getZForResolution = function(resolution) {
  var z;
  for (z = 0; z < this.numResolutions_; ++z) {
    if (this.resolutions_[z] == resolution) {
      return z;
    } else if (this.resolutions_[z] < resolution) {
      if (z === 0) {
        return z;
      } else if (resolution - this.resolutions_[z] <=
          this.resolutions_[z - 1] - resolution) {
        return z;
      } else {
        return z - 1;
      }
    }
  }
  return this.numResolutions_ - 1;
};
