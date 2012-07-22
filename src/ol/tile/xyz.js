goog.provide('ol.tilegrid.createXYZ');
goog.provide('ol.tilelayer.createXYZ');
goog.provide('ol.tilestore.createXYZ');

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
 * @param {number} maxZoom Maximum zoom.
 * @return {ol.TileGrid} Tile grid.
 */
ol.tilegrid.createXYZ = function(maxZoom) {

  var resolutions = new Array(maxZoom + 1);
  var z;
  for (z = 0; z <= maxZoom; ++z) {
    resolutions[z] = ol.Projection.EPSG_3857_HALF_SIZE / (128 << z);
  }

  var extent = ol.Projection.EPSG_3857_EXTENT;
  var origin = new ol.Coordinate(
      -ol.Projection.EPSG_3857_HALF_SIZE, ol.Projection.EPSG_3857_HALF_SIZE);
  var tileSize = new ol.Size(256, 256);

  return new ol.TileGrid(resolutions, extent, origin, tileSize);

};


/**
 * @param {number} maxZoom Maximum zoom.
 * @param {Array.<string>} templates Templates.
 * @param {string=} opt_attribution Attribution.
 * @param {string=} opt_crossOrigin Cross origin.
 * @param {Object.<string, *>=} opt_values Values.
 * @return {ol.Layer} Layer.
 */
ol.tilelayer.createXYZ =
    function(maxZoom, templates, opt_attribution, opt_crossOrigin, opt_values) {
  var store = ol.tilestore.createXYZ(
      maxZoom, templates, opt_attribution, opt_crossOrigin);
  return new ol.TileLayer(store, opt_values);
};


/**
 * @param {number} maxZoom Maximum zoom.
 * @param {Array.<string>} templates Templates.
 * @param {string=} opt_attribution Attribution.
 * @param {string=} opt_crossOrigin Cross origin.
 * @return {ol.TileStore} Tile store.
 */
ol.tilestore.createXYZ =
    function(maxZoom, templates, opt_attribution, opt_crossOrigin) {

  var projection = ol.Projection.getFromCode('EPSG:3857');
  var tileGrid = ol.tilegrid.createXYZ(maxZoom);
  var tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
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
      ol.TileUrlFunction.createFromTemplates(templates));
  var extent = projection.getExtent();

  return new ol.TileStore(projection, tileGrid, tileUrlFunction, extent,
      opt_attribution, opt_crossOrigin);

};
