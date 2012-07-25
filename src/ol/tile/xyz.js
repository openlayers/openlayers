goog.provide('ol.layer.XYZ');
goog.provide('ol.tilegrid.XYZ');
goog.provide('ol.tilestore.XYZ');

goog.require('goog.math');
goog.require('ol.Coordinate');
goog.require('ol.Layer');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');
goog.require('ol.TileLayer');
goog.require('ol.TileStore');
goog.require('ol.TileUrlFunction');



/**
 * @constructor
 * @extends {ol.TileGrid}
 * @param {number} maxZoom Maximum zoom.
 */
ol.tilegrid.XYZ = function(maxZoom) {

  var resolutions = new Array(maxZoom + 1);
  var z;
  for (z = 0; z <= maxZoom; ++z) {
    resolutions[z] = ol.Projection.EPSG_3857_HALF_SIZE / (128 << z);
  }

  var extent = ol.Projection.EPSG_3857_EXTENT;
  var origin = new ol.Coordinate(
      -ol.Projection.EPSG_3857_HALF_SIZE, ol.Projection.EPSG_3857_HALF_SIZE);
  var tileSize = new ol.Size(256, 256);

  goog.base(this, resolutions, extent, origin, tileSize);

};
goog.inherits(ol.tilegrid.XYZ, ol.TileGrid);



/**
 * @constructor
 * @extends {ol.TileLayer}
 * @param {number} maxZoom Maximum zoom.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @param {string=} opt_crossOrigin Cross origin.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.XYZ = function(maxZoom, tileUrlFunction, opt_crossOrigin, opt_values) {
  var tileStore = new ol.tilestore.XYZ(
      maxZoom, tileUrlFunction, opt_crossOrigin);
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol.layer.XYZ, ol.TileLayer);



/**
 * @constructor
 * @extends {ol.TileStore}
 * @param {number} maxZoom Maximum zoom.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @param {string=} opt_attribution Attribution.
 * @param {string=} opt_crossOrigin Cross origin.
 */
ol.tilestore.XYZ =
    function(maxZoom, tileUrlFunction, opt_attribution, opt_crossOrigin) {

  var projection = ol.Projection.getFromCode('EPSG:3857');
  var tileGrid = new ol.tilegrid.XYZ(maxZoom);
  var tileUrlFunction2 = ol.TileUrlFunction.withTileCoordTransform(
      function(tileCoord) {
        var n = 1 << tileCoord.z;
        var y = -tileCoord.y - 1;
        if (y < 0 || n <= y) {
          return null;
        } else {
          var x = goog.math.modulo(tileCoord.x, n);
          return new ol.TileCoord(tileCoord.z, x, y);
        }
      },
      tileUrlFunction);
  var extent = projection.getExtent();

  goog.base(
      this, projection, tileGrid, tileUrlFunction2, extent, opt_crossOrigin);

};
goog.inherits(ol.tilestore.XYZ, ol.TileStore);
