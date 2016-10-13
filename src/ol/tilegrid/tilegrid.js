goog.provide('ol.tilegrid.TileGrid');

goog.require('ol');
goog.require('ol.asserts');
goog.require('ol.TileRange');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.math');
goog.require('ol.size');
goog.require('ol.tilecoord');


/**
 * @classdesc
 * Base class for setting the grid pattern for sources accessing tiled-image
 * servers.
 *
 * @constructor
 * @param {olx.tilegrid.TileGridOptions} options Tile grid options.
 * @struct
 * @api stable
 */
ol.tilegrid.TileGrid = function(options) {

  /**
   * @protected
   * @type {number}
   */
  this.minZoom = options.minZoom !== undefined ? options.minZoom : 0;

  /**
   * @private
   * @type {!Array.<number>}
   */
  this.resolutions_ = options.resolutions;
  ol.asserts.assert(ol.array.isSorted(this.resolutions_, function(a, b) {
    return b - a;
  }, true), 17); // `resolutions` must be sorted in descending order

  /**
   * @protected
   * @type {number}
   */
  this.maxZoom = this.resolutions_.length - 1;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.origin_ = options.origin !== undefined ? options.origin : null;

  /**
   * @private
   * @type {Array.<ol.Coordinate>}
   */
  this.origins_ = null;
  if (options.origins !== undefined) {
    this.origins_ = options.origins;
    ol.asserts.assert(this.origins_.length == this.resolutions_.length,
        20); // Number of `origins` and `resolutions` must be equal
  }

  var extent = options.extent;

  if (extent !== undefined &&
      !this.origin_ && !this.origins_) {
    this.origin_ = ol.extent.getTopLeft(extent);
  }

  ol.asserts.assert(
      (!this.origin_ && this.origins_) || (this.origin_ && !this.origins_),
      18); // Either `origin` or `origins` must be configured, never both

  /**
   * @private
   * @type {Array.<number|ol.Size>}
   */
  this.tileSizes_ = null;
  if (options.tileSizes !== undefined) {
    this.tileSizes_ = options.tileSizes;
    ol.asserts.assert(this.tileSizes_.length == this.resolutions_.length,
        19); // Number of `tileSizes` and `resolutions` must be equal
  }

  /**
   * @private
   * @type {number|ol.Size}
   */
  this.tileSize_ = options.tileSize !== undefined ?
      options.tileSize :
      !this.tileSizes_ ? ol.DEFAULT_TILE_SIZE : null;
  ol.asserts.assert(
      (!this.tileSize_ && this.tileSizes_) ||
      (this.tileSize_ && !this.tileSizes_),
      22); // Either `tileSize` or `tileSizes` must be configured, never both

  /**
   * @private
   * @type {ol.Extent}
   */
  this.extent_ = extent !== undefined ? extent : null;


  /**
   * @private
   * @type {Array.<ol.TileRange>}
   */
  this.fullTileRanges_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.tmpSize_ = [0, 0];

  if (options.sizes !== undefined) {
    ol.DEBUG && console.assert(options.sizes.length == this.resolutions_.length,
        'number of sizes and resolutions must be equal');
    this.fullTileRanges_ = options.sizes.map(function(size, z) {
      ol.DEBUG && console.assert(size[0] !== 0, 'width must not be 0');
      ol.DEBUG && console.assert(size[1] !== 0, 'height must not be 0');
      var tileRange = new ol.TileRange(
          Math.min(0, size[0]), Math.max(size[0] - 1, -1),
          Math.min(0, size[1]), Math.max(size[1] - 1, -1));
      return tileRange;
    }, this);
  } else if (extent) {
    this.calculateTileRanges_(extent);
  }

};


/**
 * @private
 * @type {ol.TileCoord}
 */
ol.tilegrid.TileGrid.tmpTileCoord_ = [0, 0, 0];


/**
 * Call a function with each tile coordinate for a given extent and zoom level.
 *
 * @param {ol.Extent} extent Extent.
 * @param {number} zoom Zoom level.
 * @param {function(ol.TileCoord)} callback Function called with each tile coordinate.
 * @api
 */
ol.tilegrid.TileGrid.prototype.forEachTileCoord = function(extent, zoom, callback) {
  var tileRange = this.getTileRangeForExtentAndZ(extent, zoom);
  for (var i = tileRange.minX, ii = tileRange.maxX; i <= ii; ++i) {
    for (var j = tileRange.minY, jj = tileRange.maxY; j <= jj; ++j) {
      callback([zoom, i, j]);
    }
  }
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {function(this: T, number, ol.TileRange): boolean} callback Callback.
 * @param {T=} opt_this The object to use as `this` in `callback`.
 * @param {ol.TileRange=} opt_tileRange Temporary ol.TileRange object.
 * @param {ol.Extent=} opt_extent Temporary ol.Extent object.
 * @return {boolean} Callback succeeded.
 * @template T
 */
ol.tilegrid.TileGrid.prototype.forEachTileCoordParentTileRange = function(tileCoord, callback, opt_this, opt_tileRange, opt_extent) {
  var tileCoordExtent = this.getTileCoordExtent(tileCoord, opt_extent);
  var z = tileCoord[0] - 1;
  while (z >= this.minZoom) {
    if (callback.call(opt_this, z,
        this.getTileRangeForExtentAndZ(tileCoordExtent, z, opt_tileRange))) {
      return true;
    }
    --z;
  }
  return false;
};


/**
 * Get the extent for this tile grid, if it was configured.
 * @return {ol.Extent} Extent.
 */
ol.tilegrid.TileGrid.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * Get the maximum zoom level for the grid.
 * @return {number} Max zoom.
 * @api
 */
ol.tilegrid.TileGrid.prototype.getMaxZoom = function() {
  return this.maxZoom;
};


/**
 * Get the minimum zoom level for the grid.
 * @return {number} Min zoom.
 * @api
 */
ol.tilegrid.TileGrid.prototype.getMinZoom = function() {
  return this.minZoom;
};


/**
 * Get the origin for the grid at the given zoom level.
 * @param {number} z Z.
 * @return {ol.Coordinate} Origin.
 * @api stable
 */
ol.tilegrid.TileGrid.prototype.getOrigin = function(z) {
  if (this.origin_) {
    return this.origin_;
  } else {
    ol.DEBUG && console.assert(this.minZoom <= z && z <= this.maxZoom,
        'given z is not in allowed range (%s <= %s <= %s)',
        this.minZoom, z, this.maxZoom);
    return this.origins_[z];
  }
};


/**
 * Get the resolution for the given zoom level.
 * @param {number} z Z.
 * @return {number} Resolution.
 * @api stable
 */
ol.tilegrid.TileGrid.prototype.getResolution = function(z) {
  ol.DEBUG && console.assert(this.minZoom <= z && z <= this.maxZoom,
      'given z is not in allowed range (%s <= %s <= %s)',
      this.minZoom, z, this.maxZoom);
  return this.resolutions_[z];
};


/**
 * Get the list of resolutions for the tile grid.
 * @return {Array.<number>} Resolutions.
 * @api stable
 */
ol.tilegrid.TileGrid.prototype.getResolutions = function() {
  return this.resolutions_;
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileRange=} opt_tileRange Temporary ol.TileRange object.
 * @param {ol.Extent=} opt_extent Temporary ol.Extent object.
 * @return {ol.TileRange} Tile range.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordChildTileRange = function(tileCoord, opt_tileRange, opt_extent) {
  if (tileCoord[0] < this.maxZoom) {
    var tileCoordExtent = this.getTileCoordExtent(tileCoord, opt_extent);
    return this.getTileRangeForExtentAndZ(
        tileCoordExtent, tileCoord[0] + 1, opt_tileRange);
  } else {
    return null;
  }
};


/**
 * @param {number} z Z.
 * @param {ol.TileRange} tileRange Tile range.
 * @param {ol.Extent=} opt_extent Temporary ol.Extent object.
 * @return {ol.Extent} Extent.
 */
ol.tilegrid.TileGrid.prototype.getTileRangeExtent = function(z, tileRange, opt_extent) {
  var origin = this.getOrigin(z);
  var resolution = this.getResolution(z);
  var tileSize = ol.size.toSize(this.getTileSize(z), this.tmpSize_);
  var minX = origin[0] + tileRange.minX * tileSize[0] * resolution;
  var maxX = origin[0] + (tileRange.maxX + 1) * tileSize[0] * resolution;
  var minY = origin[1] + tileRange.minY * tileSize[1] * resolution;
  var maxY = origin[1] + (tileRange.maxY + 1) * tileSize[1] * resolution;
  return ol.extent.createOrUpdate(minX, minY, maxX, maxY, opt_extent);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {ol.TileRange=} opt_tileRange Temporary tile range object.
 * @return {ol.TileRange} Tile range.
 */
ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndResolution = function(extent, resolution, opt_tileRange) {
  var tileCoord = ol.tilegrid.TileGrid.tmpTileCoord_;
  this.getTileCoordForXYAndResolution_(
      extent[0], extent[1], resolution, false, tileCoord);
  var minX = tileCoord[1];
  var minY = tileCoord[2];
  this.getTileCoordForXYAndResolution_(
      extent[2], extent[3], resolution, true, tileCoord);
  return ol.TileRange.createOrUpdate(
      minX, tileCoord[1], minY, tileCoord[2], opt_tileRange);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} z Z.
 * @param {ol.TileRange=} opt_tileRange Temporary tile range object.
 * @return {ol.TileRange} Tile range.
 */
ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndZ = function(extent, z, opt_tileRange) {
  var resolution = this.getResolution(z);
  return this.getTileRangeForExtentAndResolution(
      extent, resolution, opt_tileRange);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {ol.Coordinate} Tile center.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordCenter = function(tileCoord) {
  var origin = this.getOrigin(tileCoord[0]);
  var resolution = this.getResolution(tileCoord[0]);
  var tileSize = ol.size.toSize(this.getTileSize(tileCoord[0]), this.tmpSize_);
  return [
    origin[0] + (tileCoord[1] + 0.5) * tileSize[0] * resolution,
    origin[1] + (tileCoord[2] + 0.5) * tileSize[1] * resolution
  ];
};


/**
 * Get the extent of a tile coordinate.
 *
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Extent=} opt_extent Temporary extent object.
 * @return {ol.Extent} Extent.
 * @api
 */
ol.tilegrid.TileGrid.prototype.getTileCoordExtent = function(tileCoord, opt_extent) {
  var origin = this.getOrigin(tileCoord[0]);
  var resolution = this.getResolution(tileCoord[0]);
  var tileSize = ol.size.toSize(this.getTileSize(tileCoord[0]), this.tmpSize_);
  var minX = origin[0] + tileCoord[1] * tileSize[0] * resolution;
  var minY = origin[1] + tileCoord[2] * tileSize[1] * resolution;
  var maxX = minX + tileSize[0] * resolution;
  var maxY = minY + tileSize[1] * resolution;
  return ol.extent.createOrUpdate(minX, minY, maxX, maxY, opt_extent);
};


/**
 * Get the tile coordinate for the given map coordinate and resolution.  This
 * method considers that coordinates that intersect tile boundaries should be
 * assigned the higher tile coordinate.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} resolution Resolution.
 * @param {ol.TileCoord=} opt_tileCoord Destination ol.TileCoord object.
 * @return {ol.TileCoord} Tile coordinate.
 * @api
 */
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndResolution = function(coordinate, resolution, opt_tileCoord) {
  return this.getTileCoordForXYAndResolution_(
      coordinate[0], coordinate[1], resolution, false, opt_tileCoord);
};


/**
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} resolution Resolution.
 * @param {boolean} reverseIntersectionPolicy Instead of letting edge
 *     intersections go to the higher tile coordinate, let edge intersections
 *     go to the lower tile coordinate.
 * @param {ol.TileCoord=} opt_tileCoord Temporary ol.TileCoord object.
 * @return {ol.TileCoord} Tile coordinate.
 * @private
 */
ol.tilegrid.TileGrid.prototype.getTileCoordForXYAndResolution_ = function(
    x, y, resolution, reverseIntersectionPolicy, opt_tileCoord) {
  var z = this.getZForResolution(resolution);
  var scale = resolution / this.getResolution(z);
  var origin = this.getOrigin(z);
  var tileSize = ol.size.toSize(this.getTileSize(z), this.tmpSize_);

  var adjustX = reverseIntersectionPolicy ? 0.5 : 0;
  var adjustY = reverseIntersectionPolicy ? 0 : 0.5;
  var xFromOrigin = Math.floor((x - origin[0]) / resolution + adjustX);
  var yFromOrigin = Math.floor((y - origin[1]) / resolution + adjustY);
  var tileCoordX = scale * xFromOrigin / tileSize[0];
  var tileCoordY = scale * yFromOrigin / tileSize[1];

  if (reverseIntersectionPolicy) {
    tileCoordX = Math.ceil(tileCoordX) - 1;
    tileCoordY = Math.ceil(tileCoordY) - 1;
  } else {
    tileCoordX = Math.floor(tileCoordX);
    tileCoordY = Math.floor(tileCoordY);
  }

  return ol.tilecoord.createOrUpdate(z, tileCoordX, tileCoordY, opt_tileCoord);
};


/**
 * Get a tile coordinate given a map coordinate and zoom level.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} z Zoom level.
 * @param {ol.TileCoord=} opt_tileCoord Destination ol.TileCoord object.
 * @return {ol.TileCoord} Tile coordinate.
 * @api
 */
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndZ = function(coordinate, z, opt_tileCoord) {
  var resolution = this.getResolution(z);
  return this.getTileCoordForXYAndResolution_(
      coordinate[0], coordinate[1], resolution, false, opt_tileCoord);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {number} Tile resolution.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordResolution = function(tileCoord) {
  ol.DEBUG && console.assert(
      this.minZoom <= tileCoord[0] && tileCoord[0] <= this.maxZoom,
      'z of given tilecoord is not in allowed range (%s <= %s <= %s',
      this.minZoom, tileCoord[0], this.maxZoom);
  return this.resolutions_[tileCoord[0]];
};


/**
 * Get the tile size for a zoom level. The type of the return value matches the
 * `tileSize` or `tileSizes` that the tile grid was configured with. To always
 * get an `ol.Size`, run the result through `ol.size.toSize()`.
 * @param {number} z Z.
 * @return {number|ol.Size} Tile size.
 * @api stable
 */
ol.tilegrid.TileGrid.prototype.getTileSize = function(z) {
  if (this.tileSize_) {
    return this.tileSize_;
  } else {
    ol.DEBUG && console.assert(this.minZoom <= z && z <= this.maxZoom,
        'z is not in allowed range (%s <= %s <= %s',
        this.minZoom, z, this.maxZoom);
    return this.tileSizes_[z];
  }
};


/**
 * @param {number} z Zoom level.
 * @return {ol.TileRange} Extent tile range for the specified zoom level.
 */
ol.tilegrid.TileGrid.prototype.getFullTileRange = function(z) {
  if (!this.fullTileRanges_) {
    return null;
  } else {
    ol.DEBUG && console.assert(this.minZoom <= z && z <= this.maxZoom,
        'z is not in allowed range (%s <= %s <= %s',
        this.minZoom, z, this.maxZoom);
    return this.fullTileRanges_[z];
  }
};


/**
 * @param {number} resolution Resolution.
 * @param {number=} opt_direction If 0, the nearest resolution will be used.
 *     If 1, the nearest lower resolution will be used. If -1, the nearest
 *     higher resolution will be used. Default is 0.
 * @return {number} Z.
 * @api
 */
ol.tilegrid.TileGrid.prototype.getZForResolution = function(
    resolution, opt_direction) {
  var z = ol.array.linearFindNearest(this.resolutions_, resolution,
      opt_direction || 0);
  return ol.math.clamp(z, this.minZoom, this.maxZoom);
};


/**
 * @param {!ol.Extent} extent Extent for this tile grid.
 * @private
 */
ol.tilegrid.TileGrid.prototype.calculateTileRanges_ = function(extent) {
  var length = this.resolutions_.length;
  var fullTileRanges = new Array(length);
  for (var z = this.minZoom; z < length; ++z) {
    fullTileRanges[z] = this.getTileRangeForExtentAndZ(extent, z);
  }
  this.fullTileRanges_ = fullTileRanges;
};
