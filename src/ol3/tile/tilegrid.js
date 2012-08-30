// FIXME cope with tile grids whose minium zoom is not zero

goog.provide('ol3.TileGrid');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol3.Coordinate');
goog.require('ol3.Extent');
goog.require('ol3.PixelBounds');
goog.require('ol3.Size');
goog.require('ol3.TileBounds');
goog.require('ol3.TileCoord');
goog.require('ol3.array');



/**
 * @constructor
 * @param {!Array.<number>} resolutions Resolutions.
 * @param {ol3.Extent} extent Extent.
 * @param {ol3.Coordinate|!Array.<ol3.Coordinate>} origin Origin.
 * @param {ol3.Size=} opt_tileSize Tile size.
 */
ol3.TileGrid = function(resolutions, extent, origin, opt_tileSize) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.resolutions_ = resolutions;
  goog.asserts.assert(goog.array.isSorted(resolutions, function(a, b) {
    return b - a;
  }, true));

  /**
   * @private
   * @type {number}
   */
  this.numResolutions_ = this.resolutions_.length;

  /**
   * @private
   * @type {ol3.Extent}
   */
  this.extent_ = extent;

  /**
   * @private
   * @type {ol3.Coordinate}
   */
  this.origin_ = null;

  /**
   * @private
   * @type {Array.<ol3.Coordinate>}
   */
  this.origins_ = null;

  if (origin instanceof ol3.Coordinate) {
    this.origin_ = origin;
  } else if (goog.isArray(origin)) {
    goog.asserts.assert(origin.length == this.numResolutions_);
    this.origins_ = origin;
  } else {
    goog.asserts.assert(false);
  }

  /**
   * @private
   * @type {ol3.Size}
   */
  this.tileSize_ = opt_tileSize || new ol3.Size(256, 256);

};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @param {function(this: T, number, ol3.TileBounds): boolean} callback
 *     Callback.
 * @param {T=} opt_obj Object.
 * @template T
 */
ol3.TileGrid.prototype.forEachTileCoordParentTileBounds =
    function(tileCoord, callback, opt_obj) {
  var tileCoordExtent = this.getTileCoordExtent(tileCoord);
  var z = tileCoord.z - 1;
  while (z >= 0) {
    if (callback.call(
        opt_obj, z, this.getTileBoundsForExtentAndZ(tileCoordExtent, z))) {
      return;
    }
    --z;
  }
};


/**
 * @return {ol3.Extent} Extent.
 */
ol3.TileGrid.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @param {number} z Z.
 * @return {ol3.Coordinate} Origin.
 */
ol3.TileGrid.prototype.getOrigin = function(z) {
  if (!goog.isNull(this.origin_)) {
    return this.origin_;
  } else {
    goog.asserts.assert(!goog.isNull(this.origins_));
    goog.asserts.assert(0 <= z && z < this.origins_.length);
    return this.origins_[z];
  }
};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @param {number} resolution Resolution.
 * @return {ol3.PixelBounds} Pixel bounds.
 */
ol3.TileGrid.prototype.getPixelBoundsForTileCoordAndResolution = function(
    tileCoord, resolution) {
  var scale = resolution / this.getResolution(tileCoord.z);
  var tileSize = this.getTileSize();
  tileSize = new ol3.Size(tileSize.width / scale,
                          tileSize.height / scale);
  var minX, maxX, minY, maxY;
  minX = Math.round(tileCoord.x * tileSize.width);
  maxX = Math.round((tileCoord.x + 1) * tileSize.width);
  minY = Math.round(tileCoord.y * tileSize.height);
  maxY = Math.round((tileCoord.y + 1) * tileSize.height);
  return new ol3.PixelBounds(minX, minY, maxX, maxY);
};


/**
 * @param {number} z Z.
 * @return {number} Resolution.
 */
ol3.TileGrid.prototype.getResolution = function(z) {
  goog.asserts.assert(0 <= z && z < this.numResolutions_);
  return this.resolutions_[z];
};


/**
 * @return {Array.<number>} Resolutions.
 */
ol3.TileGrid.prototype.getResolutions = function() {
  return this.resolutions_;
};


/**
 * @param {number} z Z.
 * @param {ol3.TileBounds} tileBounds Tile bounds.
 * @return {ol3.Extent} Extent.
 */
ol3.TileGrid.prototype.getTileBoundsExtent = function(z, tileBounds) {
  var origin = this.getOrigin(z);
  var resolution = this.getResolution(z);
  var tileSize = this.tileSize_;
  var minX = origin.x + tileBounds.minX * tileSize.width * resolution;
  var minY = origin.y + tileBounds.minY * tileSize.height * resolution;
  var maxX = origin.x + (tileBounds.maxX + 1) * tileSize.width * resolution;
  var maxY = origin.y + (tileBounds.maxY + 1) * tileSize.height * resolution;
  return new ol3.Extent(minX, minY, maxX, maxY);
};


/**
 * @param {ol3.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {ol3.TileBounds} Tile bounds.
 */
ol3.TileGrid.prototype.getTileBoundsForExtentAndResolution = function(
    extent, resolution) {
  var min = this.getTileCoordForCoordAndResolution(
      new ol3.Coordinate(extent.minX, extent.minY), resolution);
  var max = this.getTileCoordForCoordAndResolution(
      new ol3.Coordinate(extent.maxX, extent.maxY), resolution);
  return new ol3.TileBounds(min.x, min.y, max.x, max.y);
};


/**
 * @param {ol3.Extent} extent Extent.
 * @param {number} z Z.
 * @return {ol3.TileBounds} Tile bounds.
 */
ol3.TileGrid.prototype.getTileBoundsForExtentAndZ = function(extent, z) {
  var resolution = this.getResolution(z);
  return this.getTileBoundsForExtentAndResolution(extent, resolution);
};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @return {ol3.Coordinate} Tile center.
 */
ol3.TileGrid.prototype.getTileCoordCenter = function(tileCoord) {
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.tileSize_;
  var x = origin.x + (tileCoord.x + 0.5) * tileSize.width * resolution;
  var y = origin.y + (tileCoord.y + 0.5) * tileSize.height * resolution;
  return new ol3.Coordinate(x, y);
};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @return {ol3.Extent} Extent.
 */
ol3.TileGrid.prototype.getTileCoordExtent = function(tileCoord) {
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.tileSize_;
  var minX = origin.x + tileCoord.x * tileSize.width * resolution;
  var minY = origin.y + tileCoord.y * tileSize.height * resolution;
  var maxX = minX + tileSize.width * resolution;
  var maxY = minY + tileSize.height * resolution;
  return new ol3.Extent(minX, minY, maxX, maxY);
};


/**
 * @param {ol3.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @return {ol3.TileCoord} Tile coordinate.
 */
ol3.TileGrid.prototype.getTileCoordForCoordAndResolution = function(
    coordinate, resolution) {
  var z = this.getZForResolution(resolution);
  var scale = resolution / this.getResolution(z);
  var origin = this.getOrigin(z);

  var offsetFromOrigin = new ol3.Coordinate(
      Math.floor((coordinate.x - origin.x) / resolution),
      Math.floor((coordinate.y - origin.y) / resolution));

  var tileSize = this.getTileSize();
  tileSize = new ol3.Size(tileSize.width / scale,
                          tileSize.height / scale);

  var x, y;
  x = Math.floor(offsetFromOrigin.x / tileSize.width);
  y = Math.floor(offsetFromOrigin.y / tileSize.height);

  var tileCoord = new ol3.TileCoord(z, x, y);
  var tileCoordPixelBounds = this.getPixelBoundsForTileCoordAndResolution(
      tileCoord, resolution);

  // adjust x to allow for stretched tiles
  if (offsetFromOrigin.x < tileCoordPixelBounds.minX) {
    tileCoord.x -= 1;
  } else if (offsetFromOrigin.x >= tileCoordPixelBounds.maxX) {
    tileCoord.x += 1;
  }
  // adjust y to allow for stretched tiles
  if (offsetFromOrigin.y < tileCoordPixelBounds.minY) {
    tileCoord.y -= 1;
  } else if (offsetFromOrigin.y >= tileCoordPixelBounds.maxY) {
    tileCoord.y += 1;
  }

  return tileCoord;
};


/**
 * @param {ol3.Coordinate} coordinate Coordinate.
 * @param {number} z Z.
 * @return {ol3.TileCoord} Tile coordinate.
 */
ol3.TileGrid.prototype.getTileCoordForCoordAndZ = function(coordinate, z) {
  var resolution = this.getResolution(z);
  return this.getTileCoordForCoordAndResolution(coordinate, resolution);
};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @return {number} Tile resolution.
 */
ol3.TileGrid.prototype.getTileCoordResolution = function(tileCoord) {
  goog.asserts.assert(0 <= tileCoord.z && tileCoord.z < this.numResolutions_);
  return this.resolutions_[tileCoord.z];
};


/**
 * @return {ol3.Size} Tile size.
 */
ol3.TileGrid.prototype.getTileSize = function() {
  return this.tileSize_;
};


/**
 * @param {number} resolution Resolution.
 * @return {number} Z.
 */
ol3.TileGrid.prototype.getZForResolution = function(resolution) {
  return ol3.array.linearFindNearest(this.resolutions_, resolution);
};
