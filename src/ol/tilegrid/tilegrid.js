// FIXME cope with tile grids whose minium zoom is not zero

goog.provide('ol.tilegrid.TileGrid');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.PixelBounds');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.array');


/**
 * @define {number} Default tile size.
 */
ol.DEFAULT_TILE_SIZE = 256;



/**
 * @constructor
 * @param {ol.tilegrid.TileGridOptions} tileGridOptions Tile grid options.
 */
ol.tilegrid.TileGrid = function(tileGridOptions) {

  /**
   * @private
   * @type {!Array.<number>}
   */
  this.resolutions_ = tileGridOptions.resolutions;
  goog.asserts.assert(goog.array.isSorted(this.resolutions_, function(a, b) {
    return b - a;
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
  this.extent_ = goog.isDef(tileGridOptions.extent) ?
      tileGridOptions.extent : null;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.origin_ = goog.isDef(tileGridOptions.origin) ?
      tileGridOptions.origin : null;

  /**
   * @private
   * @type {Array.<ol.Coordinate>}
   */
  this.origins_ = null;
  if (goog.isDef(tileGridOptions.origins)) {
    this.origins_ = tileGridOptions.origins;
    goog.asserts.assert(this.origins_.length == this.resolutions_.length);
  }

  /**
   * @private
   * @type {ol.Size}
   */
  this.tileSize_ = goog.isDef(tileGridOptions.tileSize) ?
      tileGridOptions.tileSize :
      new ol.Size(ol.DEFAULT_TILE_SIZE, ol.DEFAULT_TILE_SIZE);

};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {function(this: T, number, ol.TileRange): boolean} callback
 *     Callback.
 * @param {T=} opt_obj Object.
 * @template T
 */
ol.tilegrid.TileGrid.prototype.forEachTileCoordParentTileRange =
    function(tileCoord, callback, opt_obj) {
  var tileCoordExtent = this.getTileCoordExtent(tileCoord);
  var z = tileCoord.z - 1;
  while (z >= 0) {
    if (callback.call(
        opt_obj, z, this.getTileRangeForExtentAndZ(tileCoordExtent, z))) {
      return;
    }
    --z;
  }
};


/**
 * @return {ol.Extent} Extent.
 */
ol.tilegrid.TileGrid.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @param {number} z Z.
 * @return {ol.Coordinate} Origin.
 */
ol.tilegrid.TileGrid.prototype.getOrigin = function(z) {
  if (!goog.isNull(this.origin_)) {
    return this.origin_;
  } else {
    goog.asserts.assert(!goog.isNull(this.origins_));
    goog.asserts.assert(0 <= z && z < this.origins_.length);
    return this.origins_[z];
  }
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {number} resolution Resolution.
 * @return {ol.PixelBounds} Pixel bounds.
 */
ol.tilegrid.TileGrid.prototype.getPixelBoundsForTileCoordAndResolution =
    function(tileCoord, resolution) {
  var scale = resolution / this.getResolution(tileCoord.z);
  var tileSize = this.getTileSize();
  tileSize = new ol.Size(tileSize.width / scale,
                         tileSize.height / scale);
  var minX, maxX, minY, maxY;
  minX = Math.round(tileCoord.x * tileSize.width);
  maxX = Math.round((tileCoord.x + 1) * tileSize.width);
  minY = Math.round(tileCoord.y * tileSize.height);
  maxY = Math.round((tileCoord.y + 1) * tileSize.height);
  return new ol.PixelBounds(minX, minY, maxX, maxY);
};


/**
 * @param {number} z Z.
 * @return {number} Resolution.
 */
ol.tilegrid.TileGrid.prototype.getResolution = function(z) {
  goog.asserts.assert(0 <= z && z < this.numResolutions_);
  return this.resolutions_[z];
};


/**
 * @return {Array.<number>} Resolutions.
 */
ol.tilegrid.TileGrid.prototype.getResolutions = function() {
  return this.resolutions_;
};


/**
 * @param {number} z Z.
 * @param {ol.TileRange} tileRange Tile range.
 * @return {ol.Extent} Extent.
 */
ol.tilegrid.TileGrid.prototype.getTileRangeExtent = function(z, tileRange) {
  var origin = this.getOrigin(z);
  var resolution = this.getResolution(z);
  var tileSize = this.tileSize_;
  var minX = origin.x + tileRange.minX * tileSize.width * resolution;
  var minY = origin.y + tileRange.minY * tileSize.height * resolution;
  var maxX = origin.x + (tileRange.maxX + 1) * tileSize.width * resolution;
  var maxY = origin.y + (tileRange.maxY + 1) * tileSize.height * resolution;
  return new ol.Extent(minX, minY, maxX, maxY);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {ol.TileRange} Tile range.
 */
ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndResolution = function(
    extent, resolution) {
  var min = this.getTileCoordForCoordAndResolution(
      new ol.Coordinate(extent.minX, extent.minY), resolution);
  var max = this.getTileCoordForCoordAndResolution(
      new ol.Coordinate(extent.maxX, extent.maxY), resolution);
  return new ol.TileRange(min.x, min.y, max.x, max.y);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} z Z.
 * @return {ol.TileRange} Tile range.
 */
ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndZ = function(extent, z) {
  var resolution = this.getResolution(z);
  return this.getTileRangeForExtentAndResolution(extent, resolution);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {ol.Coordinate} Tile center.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordCenter = function(tileCoord) {
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.tileSize_;
  var x = origin.x + (tileCoord.x + 0.5) * tileSize.width * resolution;
  var y = origin.y + (tileCoord.y + 0.5) * tileSize.height * resolution;
  return new ol.Coordinate(x, y);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {ol.Extent} Extent.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordExtent = function(tileCoord) {
  var origin = this.getOrigin(tileCoord.z);
  var resolution = this.getResolution(tileCoord.z);
  var tileSize = this.tileSize_;
  var minX = origin.x + tileCoord.x * tileSize.width * resolution;
  var minY = origin.y + tileCoord.y * tileSize.height * resolution;
  var maxX = minX + tileSize.width * resolution;
  var maxY = minY + tileSize.height * resolution;
  return new ol.Extent(minX, minY, maxX, maxY);
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndResolution = function(
    coordinate, resolution) {
  var z = this.getZForResolution(resolution);
  var scale = resolution / this.getResolution(z);
  var origin = this.getOrigin(z);

  var offsetFromOrigin = new ol.Coordinate(
      Math.floor((coordinate.x - origin.x) / resolution),
      Math.floor((coordinate.y - origin.y) / resolution));

  var tileSize = this.getTileSize();
  tileSize = new ol.Size(tileSize.width / scale,
                         tileSize.height / scale);

  var x, y;
  x = Math.floor(offsetFromOrigin.x / tileSize.width);
  y = Math.floor(offsetFromOrigin.y / tileSize.height);

  var tileCoord = new ol.TileCoord(z, x, y);
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
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} z Z.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndZ =
    function(coordinate, z) {
  var resolution = this.getResolution(z);
  return this.getTileCoordForCoordAndResolution(coordinate, resolution);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {number} Tile resolution.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordResolution = function(tileCoord) {
  goog.asserts.assert(0 <= tileCoord.z && tileCoord.z < this.numResolutions_);
  return this.resolutions_[tileCoord.z];
};


/**
 * @return {ol.Size} Tile size.
 */
ol.tilegrid.TileGrid.prototype.getTileSize = function() {
  return this.tileSize_;
};


/**
 * @param {number} resolution Resolution.
 * @return {number} Z.
 */
ol.tilegrid.TileGrid.prototype.getZForResolution = function(resolution) {
  return ol.array.linearFindNearest(this.resolutions_, resolution);
};


/**
 * @param {ol.Projection} projection Projection.
 * @param {number=} opt_maxZoom Maximum zoom level (optional). Default is 18.
 * @param {ol.Size=} opt_tileSize Tile size.
 * @return {ol.tilegrid.TileGrid} TileGrid instance.
 */
ol.tilegrid.createForProjection =
    function(projection, opt_maxZoom, opt_tileSize) {
  var projectionExtent = projection.getExtent();
  var size = Math.max(
      projectionExtent.maxX - projectionExtent.minX,
      projectionExtent.maxY - projectionExtent.minY);
  var maxZoom = goog.isDef(opt_maxZoom) ?
      opt_maxZoom : 18;
  var tileSize = goog.isDef(opt_tileSize) ?
      opt_tileSize : new ol.Size(ol.DEFAULT_TILE_SIZE, ol.DEFAULT_TILE_SIZE);
  var resolutions = new Array(maxZoom + 1);
  goog.asserts.assert(tileSize.width == tileSize.height);
  size = size / tileSize.width;
  for (var z = 0, zz = resolutions.length; z < zz; ++z) {
    resolutions[z] = size / Math.pow(2, z);
  }
  return new ol.tilegrid.TileGrid({
    origin: projectionExtent.getTopLeft(),
    resolutions: resolutions,
    tileSize: tileSize
  });
};
