goog.provide('ol.tilegrid.XYZ');

goog.require('ol.Size');
goog.require('ol.TileRange');
goog.require('ol.projection');
goog.require('ol.projection.EPSG3857');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.tilegrid.TileGrid}
 * @param {ol.tilegrid.XYZOptions} options XYZ options.
 */
ol.tilegrid.XYZ = function(options) {

  /**
   * @private
   * @type {number}
   */
  this.maxZoom_ = options.maxZoom;

  var resolutions = new Array(this.maxZoom_ + 1);
  var z;
  var size = 2 * ol.projection.EPSG3857.HALF_SIZE / ol.DEFAULT_TILE_SIZE;
  for (z = 0; z <= this.maxZoom_; ++z) {
    resolutions[z] = size / Math.pow(2, z);
  }

  goog.base(this, {
    origin: [-ol.projection.EPSG3857.HALF_SIZE,
             ol.projection.EPSG3857.HALF_SIZE],
    resolutions: resolutions,
    tileSize: new ol.Size(ol.DEFAULT_TILE_SIZE, ol.DEFAULT_TILE_SIZE)
  });

};
goog.inherits(ol.tilegrid.XYZ, ol.tilegrid.TileGrid);


/**
 * @inheritDoc
 */
ol.tilegrid.XYZ.prototype.getTileCoordChildTileRange =
    function(tileCoord, opt_tileRange) {
  if (tileCoord.z < this.maxZoom_) {
    return ol.TileRange.createOrUpdate(
        tileCoord.x << 1, tileCoord.y << 1,
        tileCoord.x + 1 << 1, tileCoord.y + 1 << 1,
        opt_tileRange);
  } else {
    return null;
  }
};


/**
 * @inheritDoc
 */
ol.tilegrid.XYZ.prototype.forEachTileCoordParentTileRange =
    function(tileCoord, callback, opt_obj, opt_tileRange) {
  var tileRange = ol.TileRange.createOrUpdate(
      0, 0, tileCoord.x, tileCoord.y, opt_tileRange);
  var z;
  for (z = tileCoord.z - 1; z >= 0; --z) {
    tileRange.minX = tileRange.maxX >>= 1;
    tileRange.minY = tileRange.maxY >>= 1;
    if (callback.call(opt_obj, z, tileRange)) {
      return true;
    }
  }
  return false;
};
