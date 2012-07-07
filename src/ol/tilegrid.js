goog.provide('ol.TileGrid');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math.Size');
goog.require('goog.positioning.Corner');
goog.require('ol.Extent');
goog.require('ol.TileBounds');
goog.require('ol.TileCoord');



/**
 * @constructor
 * @param {!Array.<number>} resolutions Resolutions.
 * @param {ol.Extent} extent Extent.
 * @param {goog.positioning.Corner} corner Corner.
 * @param {goog.math.Coordinate|!Array.<goog.math.Coordinate>} origin Origin.
 * @param {goog.math.Size=} opt_tileSize Tile size.
 */
ol.TileGrid = function(resolutions, extent, corner, origin, opt_tileSize) {

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
   * @type {ol.Extent}
   */
  this.extent_ = extent;

  /**
   * @private
   * @type {goog.positioning.Corner}
   */
  this.corner_ = corner;

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
    goog.asserts.assert(origin.length == this.resolutions_.length);
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
 * @return {goog.positioning.Corner} Corner.
 */
ol.TileGrid.prototype.getCorner = function() {
  return this.corner_;
};


/**
 * @return {ol.Extent} Extent.
 */
ol.TileGrid.prototype.getExtent = function() {
  return this.extent_;
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
  goog.asserts.assert(0 <= z && z < this.resolutions_.length);
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
 * @param {ol.Extent} extent Extent.
 * @return {ol.TileBounds} Tile bounds.
 */
ol.TileGrid.prototype.getTileBounds = function(z, extent) {
  var topRight = new goog.math.Coordinate(extent.right, extent.top);
  var bottomLeft = new goog.math.Coordinate(extent.left, extent.bottom);
  return ol.TileBounds.boundingTileBounds(
      this.getTileCoord(z, topRight),
      this.getTileCoord(z, bottomLeft));
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {goog.math.Coordinate} Tile center.
 */
ol.TileGrid.prototype.getTileCenter = function(tileCoord) {
  var corner = this.corner_;
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.tileSize_;
  var x = origin.x + (tileCoord.x + 0.5) * tileSize.width * resolution;
  var y;
  if (corner == goog.positioning.Corner.TOP_LEFT) {
    y = origin.y - (tileCoord.y + 0.5) * tileSize.height * resolution;
  } else {
    goog.asserts.assert(corner == goog.positioning.Corner.TOP_RIGHT);
    y = origin.y + (tileCoord.y + 0.5) * tileSize.height * resolution;
  }
  return new goog.math.Coordinate(x, y);
};


/**
 * @param {number} z Z.
 * @param {goog.math.Coordinate} coordinate Coordinate.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.TileGrid.prototype.getTileCoord = function(z, coordinate) {
  if (!this.extent_.contains(coordinate)) {
    return null;
  }
  var corner = this.corner_;
  var origin = this.getOrigin(z);
  var resolution = this.getResolution(z);
  var tileSize = this.getTileSize();
  var x =
      Math.floor((coordinate.x - origin.x) / (tileSize.width * resolution));
  var y;
  if (corner == goog.positioning.Corner.TOP_LEFT) {
    y = Math.floor((origin.y - coordinate.y) / (tileSize.height * resolution));
  } else {
    goog.asserts.assert(corner == goog.positioning.Corner.BOTTOM_LEFT);
    y = Math.floor((coordinate.y - origin.y) / (tileSize.height * resolution));
  }
  return new ol.TileCoord(z, x, y);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {ol.Extent} Extent.
 */
ol.TileGrid.prototype.getTileCoordExtent = function(tileCoord) {
  var corner = this.corner_;
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.tileSize_;
  var left = origin.x + tileCoord.x * tileSize.width * resolution;
  var right = left + tileSize.width * resolution;
  var top, bottom;
  if (corner == goog.positioning.Corner.TOP_LEFT) {
    top = origin.y - tileCoord.y * tileSize.height * resolution;
    bottom = top - tileSize.height * resolution;
  } else {
    goog.asserts.assert(corner == goog.positioning.Corner.BOTTOM_LEFT);
    bottom = origin.y + tileCoord.y * tileSize.height * resolution;
    top = bottom + tileSize.height * resolution;
  }
  return new ol.Extent(top, right, bottom, left);
};


/**
 * @return {goog.math.Size} Tile size.
 */
ol.TileGrid.prototype.getTileSize = function() {
  return this.tileSize_;
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {number} Tile resolution.
 */
ol.TileGrid.prototype.getTileResolution = function(tileCoord) {
  goog.asserts.assert(
      0 <= tileCoord.z && tileCoord.z < this.resolutions_.length);
  return this.resolutions_[tileCoord.z];
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {function(ol.TileBounds): boolean} callback Callback.
 */
ol.TileGrid.prototype.yieldTileCoordParents = function(tileCoord, callback) {
  var extent = this.getTileCoordExtent(tileCoord);
  var z = tileCoord.z - 1;
  while (z >= 0) {
    if (callback(this.getTileBounds(z, extent))) {
      return;
    }
    --z;
  }
};
