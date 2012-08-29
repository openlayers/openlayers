goog.provide('ol3.layer.XYZ');
goog.provide('ol3.tilegrid.XYZ');
goog.provide('ol3.tilestore.XYZ');

goog.require('goog.math');
goog.require('ol3.Attribution');
goog.require('ol3.Coordinate');
goog.require('ol3.Layer');
goog.require('ol3.Projection');
goog.require('ol3.Size');
goog.require('ol3.TileCoord');
goog.require('ol3.TileGrid');
goog.require('ol3.TileLayer');
goog.require('ol3.TileStore');
goog.require('ol3.TileUrlFunction');



/**
 * @constructor
 * @extends {ol3.TileGrid}
 * @param {number} maxZoom Maximum zoom.
 * @param {ol3.Size=} opt_tileSize Tile size.
 */
ol3.tilegrid.XYZ = function(maxZoom, opt_tileSize) {

  var resolutions = new Array(maxZoom + 1);
  var z;
  for (z = 0; z <= maxZoom; ++z) {
    resolutions[z] = ol3.Projection.EPSG_3857_HALF_SIZE / (128 << z);
  }

  var extent = ol3.Projection.EPSG_3857_EXTENT;
  var origin = new ol3.Coordinate(
      -ol3.Projection.EPSG_3857_HALF_SIZE, ol3.Projection.EPSG_3857_HALF_SIZE);

  goog.base(this, resolutions, extent, origin, opt_tileSize);

};
goog.inherits(ol3.tilegrid.XYZ, ol3.TileGrid);


/**
 * @inheritDoc
 */
ol3.tilegrid.XYZ.prototype.forEachTileCoordParentTileBounds =
    function(tileCoord, callback, opt_obj) {
  var x = tileCoord.x;
  var y = tileCoord.y;
  var z = tileCoord.z;
  var tileBounds;
  while (true) {
    z -= 1;
    if (z < 0) {
      break;
    }
    x = Math.floor(x / 2);
    y = Math.floor(y / 2);
    tileBounds = new ol3.TileBounds(x, y, x, y);
    if (callback.call(opt_obj, z, tileBounds)) {
      break;
    }
  }
};



/**
 * @constructor
 * @extends {ol3.TileLayer}
 * @param {number} maxZoom Maximum zoom.
 * @param {ol3.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @param {Array.<ol3.Attribution>=} opt_attributions Attributions.
 * @param {string=} opt_crossOrigin Cross origin.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.layer.XYZ = function(
    maxZoom, tileUrlFunction, opt_attributions, opt_crossOrigin, opt_values) {
  var tileStore = new ol3.tilestore.XYZ(
      maxZoom, tileUrlFunction, opt_attributions, opt_crossOrigin);
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol3.layer.XYZ, ol3.TileLayer);



/**
 * @constructor
 * @extends {ol3.TileStore}
 * @param {number} maxZoom Maximum zoom.
 * @param {ol3.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @param {Array.<ol3.Attribution>=} opt_attributions Attributions.
 * @param {string=} opt_crossOrigin Cross origin.
 */
ol3.tilestore.XYZ =
    function(maxZoom, tileUrlFunction, opt_attributions, opt_crossOrigin) {

  var projection = ol3.Projection.getFromCode('EPSG:3857');
  var tileGrid = new ol3.tilegrid.XYZ(maxZoom);
  var tileUrlFunction2 = ol3.TileUrlFunction.withTileCoordTransform(
      function(tileCoord) {
        var n = 1 << tileCoord.z;
        var y = -tileCoord.y - 1;
        if (y < 0 || n <= y) {
          return null;
        } else {
          var x = goog.math.modulo(tileCoord.x, n);
          return new ol3.TileCoord(tileCoord.z, x, y);
        }
      },
      tileUrlFunction);
  var extent = projection.getExtent();

  goog.base(this, projection, tileGrid, tileUrlFunction2, extent,
      opt_attributions, opt_crossOrigin);

};
goog.inherits(ol3.tilestore.XYZ, ol3.TileStore);
