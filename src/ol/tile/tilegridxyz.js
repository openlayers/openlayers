goog.provide('ol.tilegrid.createXYZ');

goog.require('ol.Coordinate');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.TileGrid');


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
