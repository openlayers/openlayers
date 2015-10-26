goog.provide('ol.tilegrid.TileGrid');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol');
goog.require('ol.Coordinate');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.extent.Corner');
goog.require('ol.math');
goog.require('ol.proj');
goog.require('ol.proj.METERS_PER_UNIT');
goog.require('ol.proj.Projection');
goog.require('ol.proj.Units');
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
  goog.asserts.assert(goog.array.isSorted(this.resolutions_, function(a, b) {
    return b - a;
  }, true), 'resolutions must be sorted in descending order');

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
    goog.asserts.assert(this.origins_.length == this.resolutions_.length,
        'number of origins and resolutions must be equal');
  }

  var extent = options.extent;

  if (extent !== undefined &&
      !this.origin_ && !this.origins_) {
    this.origin_ = ol.extent.getTopLeft(extent);
  }

  goog.asserts.assert(
      (!this.origin_ && this.origins_) ||
      (this.origin_ && !this.origins_),
      'either origin or origins must be configured, never both');

  /**
   * @private
   * @type {Array.<number|ol.Size>}
   */
  this.tileSizes_ = null;
  if (options.tileSizes !== undefined) {
    this.tileSizes_ = options.tileSizes;
    goog.asserts.assert(this.tileSizes_.length == this.resolutions_.length,
        'number of tileSizes and resolutions must be equal');
  }

  /**
   * @private
   * @type {number|ol.Size}
   */
  this.tileSize_ = options.tileSize !== undefined ?
      options.tileSize :
      !this.tileSizes_ ? ol.DEFAULT_TILE_SIZE : null;
  goog.asserts.assert(
      (!this.tileSize_ && this.tileSizes_) ||
      (this.tileSize_ && !this.tileSizes_),
      'either tileSize or tileSizes must be configured, never both');

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

  if (options.sizes !== undefined) {
    goog.asserts.assert(options.sizes.length == this.resolutions_.length,
        'number of sizes and resolutions must be equal');
    this.fullTileRanges_ = options.sizes.map(function(size, z) {
      goog.asserts.assert(size[0] !== 0, 'width must not be 0');
      goog.asserts.assert(size[1] !== 0, 'height must not be 0');
      var tileRange = new ol.TileRange(
          Math.min(0, size[0]), Math.max(size[0] - 1, -1),
          Math.min(0, size[1]), Math.max(size[1] - 1, -1));
      if (this.minZoom <= z && z <= this.maxZoom && extent !== undefined) {
        goog.asserts.assert(tileRange.containsTileRange(
            this.getTileRangeForExtentAndZ(extent, z)),
            'extent tile range must not exceed tilegrid width and height');
      }
      return tileRange;
    }, this);
  } else if (extent) {
    this.calculateTileRanges_(extent);
  }

  /**
   * @private
   * @type {ol.Size}
   */
  this.tmpSize_ = [0, 0];

};


/**
 * @private
 * @type {ol.TileCoord}
 */
ol.tilegrid.TileGrid.tmpTileCoord_ = [0, 0, 0];


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {function(this: T, number, ol.TileRange): boolean} callback Callback.
 * @param {T=} opt_this The object to use as `this` in `callback`.
 * @param {ol.TileRange=} opt_tileRange Temporary ol.TileRange object.
 * @param {ol.Extent=} opt_extent Temporary ol.Extent object.
 * @return {boolean} Callback succeeded.
 * @template T
 */
ol.tilegrid.TileGrid.prototype.forEachTileCoordParentTileRange =
    function(tileCoord, callback, opt_this, opt_tileRange, opt_extent) {
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
    goog.asserts.assert(this.origins_,
        'origins cannot be null if origin is null');
    goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom,
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
  goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom,
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
ol.tilegrid.TileGrid.prototype.getTileCoordChildTileRange =
    function(tileCoord, opt_tileRange, opt_extent) {
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
ol.tilegrid.TileGrid.prototype.getTileRangeExtent =
    function(z, tileRange, opt_extent) {
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
ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndResolution =
    function(extent, resolution, opt_tileRange) {
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
ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndZ =
    function(extent, z, opt_tileRange) {
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
ol.tilegrid.TileGrid.prototype.getTileCoordExtent =
    function(tileCoord, opt_extent) {
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
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndResolution =
    function(coordinate, resolution, opt_tileCoord) {
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
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndZ =
    function(coordinate, z, opt_tileCoord) {
  var resolution = this.getResolution(z);
  return this.getTileCoordForXYAndResolution_(
      coordinate[0], coordinate[1], resolution, false, opt_tileCoord);
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {number} Tile resolution.
 */
ol.tilegrid.TileGrid.prototype.getTileCoordResolution = function(tileCoord) {
  goog.asserts.assert(
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
    goog.asserts.assert(this.tileSizes_,
        'tileSizes cannot be null if tileSize is null');
    goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom,
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
    goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom,
        'z is not in allowed range (%s <= %s <= %s',
        this.minZoom, z, this.maxZoom);
    return this.fullTileRanges_[z];
  }
};


/**
 * @param {number} resolution Resolution.
 * @return {number} Z.
 */
ol.tilegrid.TileGrid.prototype.getZForResolution = function(resolution) {
  var z = ol.array.linearFindNearest(this.resolutions_, resolution, 0);
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


/**
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.tilegrid.TileGrid} Default tile grid for the passed projection.
 */
ol.tilegrid.getForProjection = function(projection) {
  var tileGrid = projection.getDefaultTileGrid();
  if (!tileGrid) {
    tileGrid = ol.tilegrid.createForProjection(projection);
    projection.setDefaultTileGrid(tileGrid);
  }
  return tileGrid;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number=} opt_maxZoom Maximum zoom level (default is
 *     ol.DEFAULT_MAX_ZOOM).
 * @param {number|ol.Size=} opt_tileSize Tile size (default uses
 *     ol.DEFAULT_TILE_SIZE).
 * @param {ol.extent.Corner=} opt_corner Extent corner (default is
 *     ol.extent.Corner.TOP_LEFT).
 * @return {ol.tilegrid.TileGrid} TileGrid instance.
 */
ol.tilegrid.createForExtent =
    function(extent, opt_maxZoom, opt_tileSize, opt_corner) {
  var corner = opt_corner !== undefined ?
      opt_corner : ol.extent.Corner.TOP_LEFT;

  var resolutions = ol.tilegrid.resolutionsFromExtent(
      extent, opt_maxZoom, opt_tileSize);

  return new ol.tilegrid.TileGrid({
    extent: extent,
    origin: ol.extent.getCorner(extent, corner),
    resolutions: resolutions,
    tileSize: opt_tileSize
  });
};


/**
 * Creates a tile grid with a standard XYZ tiling scheme.
 * @param {olx.tilegrid.XYZOptions=} opt_options Tile grid options.
 * @return {ol.tilegrid.TileGrid} Tile grid instance.
 * @api
 */
ol.tilegrid.createXYZ = function(opt_options) {
  var options = /** @type {olx.tilegrid.TileGridOptions} */ ({});
  goog.object.extend(options, opt_options !== undefined ?
      opt_options : /** @type {olx.tilegrid.XYZOptions} */ ({}));
  if (options.extent === undefined) {
    options.extent = ol.proj.get('EPSG:3857').getExtent();
  }
  options.resolutions = ol.tilegrid.resolutionsFromExtent(
      options.extent, options.maxZoom, options.tileSize);
  delete options.maxZoom;

  return new ol.tilegrid.TileGrid(options);
};


/**
 * Create a resolutions array from an extent.  A zoom factor of 2 is assumed.
 * @param {ol.Extent} extent Extent.
 * @param {number=} opt_maxZoom Maximum zoom level (default is
 *     ol.DEFAULT_MAX_ZOOM).
 * @param {number|ol.Size=} opt_tileSize Tile size (default uses
 *     ol.DEFAULT_TILE_SIZE).
 * @return {!Array.<number>} Resolutions array.
 */
ol.tilegrid.resolutionsFromExtent =
    function(extent, opt_maxZoom, opt_tileSize) {
  var maxZoom = opt_maxZoom !== undefined ?
      opt_maxZoom : ol.DEFAULT_MAX_ZOOM;

  var height = ol.extent.getHeight(extent);
  var width = ol.extent.getWidth(extent);

  var tileSize = ol.size.toSize(opt_tileSize !== undefined ?
      opt_tileSize : ol.DEFAULT_TILE_SIZE);
  var maxResolution = Math.max(
      width / tileSize[0], height / tileSize[1]);

  var length = maxZoom + 1;
  var resolutions = new Array(length);
  for (var z = 0; z < length; ++z) {
    resolutions[z] = maxResolution / Math.pow(2, z);
  }
  return resolutions;
};


/**
 * @param {ol.proj.ProjectionLike} projection Projection.
 * @param {number=} opt_maxZoom Maximum zoom level (default is
 *     ol.DEFAULT_MAX_ZOOM).
 * @param {ol.Size=} opt_tileSize Tile size (default uses ol.DEFAULT_TILE_SIZE).
 * @param {ol.extent.Corner=} opt_corner Extent corner (default is
 *     ol.extent.Corner.BOTTOM_LEFT).
 * @return {ol.tilegrid.TileGrid} TileGrid instance.
 */
ol.tilegrid.createForProjection =
    function(projection, opt_maxZoom, opt_tileSize, opt_corner) {
  var extent = ol.tilegrid.extentFromProjection(projection);
  return ol.tilegrid.createForExtent(
      extent, opt_maxZoom, opt_tileSize, opt_corner);
};


/**
 * Generate a tile grid extent from a projection.  If the projection has an
 * extent, it is used.  If not, a global extent is assumed.
 * @param {ol.proj.ProjectionLike} projection Projection.
 * @return {ol.Extent} Extent.
 */
ol.tilegrid.extentFromProjection = function(projection) {
  projection = ol.proj.get(projection);
  var extent = projection.getExtent();
  if (!extent) {
    var half = 180 * ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES] /
        projection.getMetersPerUnit();
    extent = ol.extent.createOrUpdate(-half, -half, half, half);
  }
  return extent;
};
