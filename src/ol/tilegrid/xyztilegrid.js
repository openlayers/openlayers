goog.provide('ol.tilegrid.XYZ');

goog.require('goog.math');
goog.require('ol.TileCoord');
goog.require('ol.TileRange');
goog.require('ol.proj');
goog.require('ol.proj.EPSG3857');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.tilegrid.TileGrid}
 * @param {olx.tilegrid.XYZOptions} options XYZ options.
 * @struct
 * @todo api
 */
ol.tilegrid.XYZ = function(options) {

  var resolutions = new Array(options.maxZoom + 1);
  var z;
  var size = 2 * ol.proj.EPSG3857.HALF_SIZE / ol.DEFAULT_TILE_SIZE;
  for (z = 0; z <= options.maxZoom; ++z) {
    resolutions[z] = size / Math.pow(2, z);
  }

  goog.base(this, {
    minZoom: options.minZoom,
    origin: [-ol.proj.EPSG3857.HALF_SIZE, ol.proj.EPSG3857.HALF_SIZE],
    resolutions: resolutions,
    tileSize: ol.DEFAULT_TILE_SIZE
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
  var tmpTileCoord = new ol.TileCoord(0, 0, 0);
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
        var z = tileCoord.z;
        if (z < minZ || maxZ < z) {
          return null;
        }
        var n = Math.pow(2, z);
        var x = tileCoord.x;
        if (wrapX) {
          x = goog.math.modulo(x, n);
        } else if (x < 0 || n <= x) {
          return null;
        }
        var y = tileCoord.y;
        if (y < -n || -1 < y) {
          return null;
        }
        if (!goog.isNull(tileRangeByZ)) {
          tmpTileCoord.z = z;
          tmpTileCoord.x = x;
          tmpTileCoord.y = y;
          if (!tileRangeByZ[z].contains(tmpTileCoord)) {
            return null;
          }
        }
        return ol.TileCoord.createOrUpdate(z, x, -y - 1, opt_tileCoord);
      });
};


/**
 * @inheritDoc
 */
ol.tilegrid.XYZ.prototype.getTileCoordChildTileRange =
    function(tileCoord, opt_tileRange) {
  if (tileCoord.z < this.maxZoom) {
    return ol.TileRange.createOrUpdate(
        2 * tileCoord.x, 2 * (tileCoord.x + 1),
        2 * tileCoord.y, 2 * (tileCoord.y + 1),
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
      0, tileCoord.x, 0, tileCoord.y, opt_tileRange);
  var z;
  for (z = tileCoord.z - 1; z >= this.minZoom; --z) {
    tileRange.minX = tileRange.maxX >>= 1;
    tileRange.minY = tileRange.maxY >>= 1;
    if (callback.call(opt_this, z, tileRange)) {
      return true;
    }
  }
  return false;
};
