goog.provide('ol.tilestore.createXYZ');

goog.require('goog.math');
goog.require('ol.Projection');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');
goog.require('ol.TileStore');
goog.require('ol.TileUrlFunction');
goog.require('ol.tilegrid.createXYZ');


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


