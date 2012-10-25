goog.provide('ol.tilegrid.XYZ');
goog.provide('ol.tilegrid.XYZOptions');

goog.require('ol.Coordinate');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.TileRange');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{maxZoom: number}}
 */
ol.tilegrid.XYZOptions;



/**
 * @constructor
 * @extends {ol.tilegrid.TileGrid}
 * @param {ol.tilegrid.XYZOptions} xyzOptions XYZ options.
 */
ol.tilegrid.XYZ = function(xyzOptions) {

  var resolutions = new Array(xyzOptions.maxZoom + 1);
  var z;
  for (z = 0; z <= xyzOptions.maxZoom; ++z) {
    resolutions[z] = ol.Projection.EPSG_3857_HALF_SIZE / (128 << z);
  }

  goog.base(this, {
    extent: ol.Projection.EPSG_3857_EXTENT,
    origin: new ol.Coordinate(-ol.Projection.EPSG_3857_HALF_SIZE,
                              ol.Projection.EPSG_3857_HALF_SIZE),
    resolutions: resolutions,
    tileSize: new ol.Size(256, 256)
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
    x = Math.floor(x / 2);
    y = Math.floor(y / 2);
    tileRange = new ol.TileRange(x, y, x, y);
    if (callback.call(opt_obj, z, tileRange)) {
      break;
    }
  }
};
