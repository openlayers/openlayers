goog.provide('ol.tilegrid.TileGrid');

goog.require('goog.array');
goog.require('goog.asserts');
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
  }, true));

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
    goog.asserts.assert(this.origins_.length == this.maxZoom + 1);
  }
  goog.asserts.assert(
      (goog.isNull(this.origin_) && !goog.isNull(this.origins_)) ||
      (!goog.isNull(this.origin_) && goog.isNull(this.origins_)));

  /**
   * @private
   * @type {Array.<number>}
   */
  this.tileSizes_ = null;
  if (goog.isDef(options.tileSizes)) {
    this.tileSizes_ = options.tileSizes;
    goog.asserts.assert(this.tileSizes_.length == this.maxZoom + 1);
  }

  /**
   * @private
   * @type {number|undefined}
   */
  this.tileSize_ = goog.isDef(options.tileSize) ?
      options.tileSize :
      goog.isNull(this.tileSizes_) ? ol.DEFAULT_TILE_SIZE : undefined;
  goog.asserts.assert(
      (!goog.isDef(this.tileSize_) && !goog.isNull(this.tileSizes_)) ||
      (goog.isDef(this.tileSize_) && goog.isNull(this.tileSizes_)));

};


/**
 * @private
 * @type {ol.TileCoord}
 */
ol.tilegrid.TileGrid.tmpTileCoord_ = [0, 0, 0];


/**
 * @param {{extent: (ol.Extent|undefined),
 *          wrapX: (boolean|undefined)}=} opt_options Options.
 * @return {function(ol.TileCoord, ol.proj.Projection, ol.TileCoord=):
 *     ol.TileCoord} Tile coordinate transform.
 */
ol.tilegrid.TileGrid.prototype.createTileCoordTransform = goog.abstractMethod;


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
 * @return {number} Max zoom.
 * @api
 */
ol.tilegrid.TileGrid.prototype.getMaxZoom = function() {
  return this.maxZoom;
};


/**
 * @return {number} Min zoom.
 * @api
 */
ol.tilegrid.TileGrid.prototype.getMinZoom = function() {
  return this.minZoom;
};


/**
 * @param {number} z Z.
 * @return {ol.Coordinate} Origin.
 * @api stable
 */
ol.tilegrid.TileGrid.prototype.getOrigin = function(z) {
  if (!goog.isNull(this.origin_)) {
    return this.origin_;
  } else {
    goog.asserts.assert(!goog.isNull(this.origins_));
    goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom);
    return this.origins_[z];
  }
};


/**
 * @param {number} z Z.
 * @return {number} Resolution.
 * @api stable
 */
ol.tilegrid.TileGrid.prototype.getResolution = function(z) {
  goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom);
  return this.resolutions_[z];
};


/**
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
  var tileSize = this.getTileSize(z);
  var minX = origin[0] + tileRange.minX * tileSize * resolution;
  var maxX = origin[0] + (tileRange.maxX + 1) * tileSize * resolution;
  var minY = origin[1] + tileRange.minY * tileSize * resolution;
  var maxY = origin[1] + (tileRange.maxY + 1) * tileSize * resolution;
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
  var tileSize = this.getTileSize(tileCoord[0]);
  return [
    origin[0] + (tileCoord[1] + 0.5) * tileSize * resolution,
    origin[1] + (tileCoord[2] + 0.5) * tileSize * resolution
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
  var tileSize = this.getTileSize(tileCoord[0]);
  var minX = origin[0] + tileCoord[1] * tileSize * resolution;
  var minY = origin[1] + tileCoord[2] * tileSize * resolution;
  var maxX = minX + tileSize * resolution;
  var maxY = minY + tileSize * resolution;
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
  var tileSize = this.getTileSize(z);

  var tileCoordX = scale * (x - origin[0]) / (resolution * tileSize);
  var tileCoordY = scale * (y - origin[1]) / (resolution * tileSize);

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
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {number} z Z.
 * @param {ol.TileCoord=} opt_tileCoord Destination ol.TileCoord object.
 * @return {ol.TileCoord} Tile coordinate.
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
      this.minZoom <= tileCoord[0] && tileCoord[0] <= this.maxZoom);
  return this.resolutions_[tileCoord[0]];
};


/**
 * @param {number} z Z.
 * @return {number} Tile size.
 * @api stable
 */
ol.tilegrid.TileGrid.prototype.getTileSize = function(z) {
  if (goog.isDef(this.tileSize_)) {
    return this.tileSize_;
  } else {
    goog.asserts.assert(!goog.isNull(this.tileSizes_));
    goog.asserts.assert(this.minZoom <= z && z <= this.maxZoom);
    return this.tileSizes_[z];
  }
};


/**
 * @param {number} resolution Resolution.
 * @return {number} Z.
 */
ol.tilegrid.TileGrid.prototype.getZForResolution = function(resolution) {
  return ol.array.linearFindNearest(this.resolutions_, resolution, 0);
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
 * @param {number=} opt_tileSize Tile size (default uses ol.DEFAULT_TILE_SIZE).
 * @param {ol.extent.Corner=} opt_corner Extent corner (default is
 *     ol.extent.Corner.BOTTOM_LEFT).
 * @return {ol.tilegrid.TileGrid} TileGrid instance.
 */
ol.tilegrid.createForExtent =
    function(extent, opt_maxZoom, opt_tileSize, opt_corner) {
  var tileSize = goog.isDef(opt_tileSize) ?
      opt_tileSize : ol.DEFAULT_TILE_SIZE;

  var corner = goog.isDef(opt_corner) ?
      opt_corner : ol.extent.Corner.BOTTOM_LEFT;

  var resolutions = ol.tilegrid.resolutionsFromExtent(
      extent, opt_maxZoom, tileSize);

  return new ol.tilegrid.TileGrid({
    origin: ol.extent.getCorner(extent, corner),
    resolutions: resolutions,
    tileSize: tileSize
  });
};


/**
 * Create a resolutions array from an extent.  A zoom factor of 2 is assumed.
 * @param {ol.Extent} extent Extent.
 * @param {number=} opt_maxZoom Maximum zoom level (default is
 *     ol.DEFAULT_MAX_ZOOM).
 * @param {number=} opt_tileSize Tile size (default uses ol.DEFAULT_TILE_SIZE).
 * @return {!Array.<number>} Resolutions array.
 */
ol.tilegrid.resolutionsFromExtent =
    function(extent, opt_maxZoom, opt_tileSize) {
  var maxZoom = goog.isDef(opt_maxZoom) ?
      opt_maxZoom : ol.DEFAULT_MAX_ZOOM;

  var height = ol.extent.getHeight(extent);
  var width = ol.extent.getWidth(extent);

  var tileSize = goog.isDef(opt_tileSize) ?
      opt_tileSize : ol.DEFAULT_TILE_SIZE;
  var maxResolution = Math.max(
      width / tileSize, height / tileSize);

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
 * @param {number=} opt_tileSize Tile size (default uses ol.DEFAULT_TILE_SIZE).
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
