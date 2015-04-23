goog.provide('ol.tilegrid.TileGrid');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.math');
goog.require('ol');
goog.require('ol.Coordinate');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.extent.Corner');
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
  this.minZoom = goog.isDef(options.minZoom) ? options.minZoom : 0;

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
  this.origin_ = goog.isDef(options.origin) ? options.origin : null;

  /**
   * @private
   * @type {Array.<ol.Coordinate>}
   */
  this.origins_ = null;
  if (goog.isDef(options.origins)) {
    this.origins_ = options.origins;
    goog.asserts.assert(this.origins_.length == this.resolutions_.length,
        'number of origins and resolutions must be equal');
  }
  goog.asserts.assert(
      (goog.isNull(this.origin_) && !goog.isNull(this.origins_)) ||
      (!goog.isNull(this.origin_) && goog.isNull(this.origins_)),
      'either origin or origins must be configured, never both');

  /**
   * @private
   * @type {Array.<number|ol.Size>}
   */
  this.tileSizes_ = null;
  if (goog.isDef(options.tileSizes)) {
    this.tileSizes_ = options.tileSizes;
    goog.asserts.assert(this.tileSizes_.length == this.resolutions_.length,
        'number of tileSizes and resolutions must be equal');
  }

  /**
   * @private
   * @type {number|ol.Size}
   */
  this.tileSize_ = goog.isDef(options.tileSize) ?
      options.tileSize :
      goog.isNull(this.tileSizes_) ? ol.DEFAULT_TILE_SIZE : null;
  goog.asserts.assert(
      (goog.isNull(this.tileSize_) && !goog.isNull(this.tileSizes_)) ||
      (!goog.isNull(this.tileSize_) && goog.isNull(this.tileSizes_)),
      'either tileSize or tileSizes must be configured, never both');


  /**
   * @private
   * @type {ol.Size}
   */
  this.tmpSize_ = [0, 0];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.widths_ = null;
  if (goog.isDef(options.widths)) {
    this.widths_ = options.widths;
    goog.asserts.assert(this.widths_.length == this.resolutions_.length,
        'number of widths and resolutions must be equal');
  }

};


/**
 * @private
 * @type {ol.TileCoord}
 */
ol.tilegrid.TileGrid.tmpTileCoord_ = [0, 0, 0];


/**
 * Returns the identity function. May be overridden in subclasses.
 * @param {{extent: (ol.Extent|undefined)}=} opt_options Options.
 * @return {function(ol.TileCoord, ol.proj.Projection, ol.TileCoord=):
 *     ol.TileCoord} Tile coordinate transform.
 */
ol.tilegrid.TileGrid.prototype.createTileCoordTransform =
    function(opt_options) {
  return goog.functions.identity;
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
  if (!goog.isNull(this.origin_)) {
    return this.origin_;
  } else {
    goog.asserts.assert(!goog.isNull(this.origins_),
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
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.Extent=} opt_extent Temporary extent object.
 * @return {ol.Extent} Extent.
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
ol.tilegrid.TileGrid.prototype.getTileCoordForCoordAndResolution = function(
    coordinate, resolution, opt_tileCoord) {
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

  var tileCoordX = scale * (x - origin[0]) / (resolution * tileSize[0]);
  var tileCoordY = scale * (y - origin[1]) / (resolution * tileSize[1]);

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
 * @param {number} z Zoom level.
 * @param {ol.proj.Projection} projection Projection.
 * @param {ol.TileRange=} opt_tileRange Tile range.
 * @return {ol.TileRange} Tile range.
 */
ol.tilegrid.TileGrid.prototype.getTileRange =
    function(z, projection, opt_tileRange) {
  var projectionExtentTileRange = this.getTileRangeForExtentAndZ(
      ol.tilegrid.extentFromProjection(projection), z);
  var width = this.getWidth(z);
  if (!goog.isDef(width)) {
    width = projectionExtentTileRange.getWidth();
  }
  return ol.TileRange.createOrUpdate(
      0, width - 1, 0, projectionExtentTileRange.getHeight(), opt_tileRange);
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
  if (!goog.isNull(this.tileSize_)) {
    return this.tileSize_;
  } else {
    goog.asserts.assert(!goog.isNull(this.tileSizes_),
        'tileSizes cannot be null if tileSize is null');
    goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom,
        'z is not in allowed range (%s <= %s <= %s',
        this.minZoom, z, this.maxZoom);
    return this.tileSizes_[z];
  }
};


/**
 * @param {number} z Zoom level.
 * @return {number|undefined} Width for the specified zoom level or `undefined`
 *     if unknown.
 */
ol.tilegrid.TileGrid.prototype.getWidth = function(z) {
  if (!goog.isNull(this.widths_)) {
    goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom,
        'z is not in allowed range (%s <= %s <= %s',
        this.minZoom, z, this.maxZoom);
    return this.widths_[z];
  }
};


/**
 * @param {number} resolution Resolution.
 * @return {number} Z.
 */
ol.tilegrid.TileGrid.prototype.getZForResolution = function(resolution) {
  var z = ol.array.linearFindNearest(this.resolutions_, resolution, 0);
  return goog.math.clamp(z, this.minZoom, this.maxZoom);
};


/**
 * @param {number} z Zoom level.
 * @param {ol.proj.Projection} projection Projection.
 * @return {boolean} Whether the tile grid is defined for the whole globe when
 *     used with the provided `projection` at zoom level `z`.
 */
ol.tilegrid.TileGrid.prototype.isGlobal = function(z, projection) {
  var width = this.getWidth(z);
  if (goog.isDef(width)) {
    var projTileGrid = ol.tilegrid.getForProjection(projection);
    var projExtent = projection.getExtent();
    return ol.size.toSize(this.getTileSize(z), this.tmpSize_)[0] * width ==
        projTileGrid.getTileSize(z) *
        projTileGrid.getTileRangeForExtentAndZ(projExtent, z).getWidth();
  } else {
    return projection.isGlobal();
  }
};


/**
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.tilegrid.TileGrid} Default tile grid for the passed projection.
 */
ol.tilegrid.getForProjection = function(projection) {
  var tileGrid = projection.getDefaultTileGrid();
  if (goog.isNull(tileGrid)) {
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
 *     ol.extent.Corner.BOTTOM_LEFT).
 * @return {ol.tilegrid.TileGrid} TileGrid instance.
 */
ol.tilegrid.createForExtent =
    function(extent, opt_maxZoom, opt_tileSize, opt_corner) {
  var tileSize = goog.isDef(opt_tileSize) ?
      ol.size.toSize(opt_tileSize) : ol.size.toSize(ol.DEFAULT_TILE_SIZE);

  var corner = goog.isDef(opt_corner) ?
      opt_corner : ol.extent.Corner.BOTTOM_LEFT;

  var resolutions = ol.tilegrid.resolutionsFromExtent(
      extent, opt_maxZoom, ol.size.toSize(tileSize));

  var widths = new Array(resolutions.length);
  var extentWidth = ol.extent.getWidth(extent);
  for (var z = resolutions.length - 1; z >= 0; --z) {
    widths[z] = extentWidth / tileSize[0] / resolutions[z];
  }

  return new ol.tilegrid.TileGrid({
    origin: ol.extent.getCorner(extent, corner),
    resolutions: resolutions,
    tileSize: goog.isDef(opt_tileSize) ? opt_tileSize : ol.DEFAULT_TILE_SIZE,
    widths: widths
  });
};


/**
 * Create a resolutions array from an extent.  A zoom factor of 2 is assumed.
 * @param {ol.Extent} extent Extent.
 * @param {number=} opt_maxZoom Maximum zoom level (default is
 *     ol.DEFAULT_MAX_ZOOM).
 * @param {ol.Size=} opt_tileSize Tile size (default uses ol.DEFAULT_TILE_SIZE).
 * @return {!Array.<number>} Resolutions array.
 */
ol.tilegrid.resolutionsFromExtent =
    function(extent, opt_maxZoom, opt_tileSize) {
  var maxZoom = goog.isDef(opt_maxZoom) ?
      opt_maxZoom : ol.DEFAULT_MAX_ZOOM;

  var height = ol.extent.getHeight(extent);
  var width = ol.extent.getWidth(extent);

  var tileSize = goog.isDef(opt_tileSize) ?
      opt_tileSize : ol.size.toSize(ol.DEFAULT_TILE_SIZE);
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
  if (goog.isNull(extent)) {
    var half = 180 * ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES] /
        projection.getMetersPerUnit();
    extent = ol.extent.createOrUpdate(-half, -half, half, half);
  }
  return extent;
};
