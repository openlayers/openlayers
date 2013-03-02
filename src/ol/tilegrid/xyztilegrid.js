goog.provide('ol.tilegrid.XYZ');

goog.require('ol.Coordinate');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.TileRange');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.tilegrid.TileGrid}
 * @param {ol.tilegrid.XYZOptions} xyzOptions XYZ options.
 */
ol.tilegrid.XYZ = function(xyzOptions) {

  var resolutions = new Array(xyzOptions.maxZoom + 1);
  var z;
  var size = 2 * ol.Projection.EPSG_3857_HALF_SIZE / ol.DEFAULT_TILE_SIZE;
  for (z = 0; z <= xyzOptions.maxZoom; ++z) {
    resolutions[z] = size / Math.pow(2, z);
  }

  goog.base(this, {
    origin: new ol.Coordinate(-ol.Projection.EPSG_3857_HALF_SIZE,
                              ol.Projection.EPSG_3857_HALF_SIZE),
    resolutions: resolutions,
    tileSize: new ol.Size(ol.DEFAULT_TILE_SIZE, ol.DEFAULT_TILE_SIZE)
  });

};
goog.inherits(ol.tilegrid.XYZ, ol.tilegrid.TileGrid);


/**
 * @inheritDoc
 */
ol.tilegrid.XYZ.prototype.forEachTileCoordParentTileRange =
    function(tileCoord, callback, opt_obj) {
  var x = tileCoord.x;
  var y = tileCoord.y;
  var z = tileCoord.z;
  var tileRange;
  while (true) {
    z -= 1;
    if (z < 0) {
      break;
    }
    x >>= 1;
    y >>= 1;
    tileRange = new ol.TileRange(x, y, x, y);
    if (callback.call(opt_obj, z, tileRange)) {
      break;
    }
  }
};
