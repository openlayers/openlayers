goog.provide('ol.tilegrid.XYZ');

goog.require('goog.math');
goog.require('ol');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.extent');
goog.require('ol.extent.Corner');
goog.require('ol.proj');
goog.require('ol.proj.EPSG3857');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');



/**
 * @classdesc
 * Set the grid pattern for sources accessing XYZ tiled-image servers.
 *
 * @constructor
 * @extends {ol.tilegrid.TileGrid}
 * @param {olx.tilegrid.XYZOptions} options XYZ options.
 * @struct
 * @api
 */
ol.tilegrid.XYZ = function(options) {
  var extent = goog.isDef(options.extent) ?
      options.extent : ol.proj.EPSG3857.EXTENT;
  var resolutions = ol.tilegrid.resolutionsFromExtent(
      extent, options.maxZoom, options.tileSize);

  goog.base(this, {
    minZoom: options.minZoom,
    origin: ol.extent.getCorner(extent, ol.extent.Corner.TOP_LEFT),
    resolutions: resolutions,
    tileSize: options.tileSize
  });

};
goog.inherits(ol.tilegrid.XYZ, ol.tilegrid.TileGrid);


/**
 * @inheritDoc
 */
ol.tilegrid.XYZ.prototype.createTileCoordTransform = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};
  var minZ = this.minZoom;
  var maxZ = this.maxZoom;
  var wrapX = goog.isDef(options.wrapX) ? options.wrapX : true;
  /** @type {Array.<ol.TileRange>} */
  var tileRangeByZ = null;
  if (goog.isDef(options.extent)) {
    tileRangeByZ = new Array(maxZ + 1);
    var z;
    for (z = 0; z <= maxZ; ++z) {
      if (z < minZ) {
        tileRangeByZ[z] = null;
      } else {
        tileRangeByZ[z] = this.getTileRangeForExtentAndZ(options.extent, z);
      }
    }
  }
  return (
      /**
       * @param {ol.TileCoord} tileCoord Tile coordinate.
       * @param {ol.proj.Projection} projection Projection.
       * @param {ol.TileCoord=} opt_tileCoord Destination tile coordinate.
       * @return {ol.TileCoord} Tile coordinate.
       */
      function(tileCoord, projection, opt_tileCoord) {
        var z = tileCoord[0];
        if (z < minZ || maxZ < z) {
          return null;
        }
        var n = Math.pow(2, z);
        var x = tileCoord[1];
        if (wrapX) {
          x = goog.math.modulo(x, n);
        } else if (x < 0 || n <= x) {
          return null;
        }
        var y = tileCoord[2];
        if (y < -n || -1 < y) {
          return null;
        }
        if (!goog.isNull(tileRangeByZ)) {
          if (!tileRangeByZ[z].containsXY(x, y)) {
            return null;
          }
        }
        return ol.tilecoord.createOrUpdate(z, x, -y - 1, opt_tileCoord);
      });
};


/**
 * @inheritDoc
 */
ol.tilegrid.XYZ.prototype.getTileCoordChildTileRange =
    function(tileCoord, opt_tileRange) {
  if (tileCoord[0] < this.maxZoom) {
    return ol.TileRange.createOrUpdate(
        2 * tileCoord[1], 2 * (tileCoord[1] + 1),
        2 * tileCoord[2], 2 * (tileCoord[2] + 1),
        opt_tileRange);
  } else {
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.tilegrid.XYZ.prototype.forEachTileCoordParentTileRange =
    function(tileCoord, callback, opt_this, opt_tileRange) {
  var tileRange = ol.TileRange.createOrUpdate(
      0, tileCoord[1], 0, tileCoord[2], opt_tileRange);
  var z;
  for (z = tileCoord[0] - 1; z >= this.minZoom; --z) {
    tileRange.minX = tileRange.maxX >>= 1;
    tileRange.minY = tileRange.maxY >>= 1;
    if (callback.call(opt_this, z, tileRange)) {
      return true;
    }
  }
  return false;
};
