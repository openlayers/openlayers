goog.provide('ol.tilestore.createOpenStreetMap');

goog.require('goog.math');
goog.require('ol.Projection');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');
goog.require('ol.TileStore');
goog.require('ol.TileUrlFunction');
goog.require('ol.tilegrid.createOpenStreetMap');


/**
 * @return {ol.TileStore} Tile store.
 */
ol.tilestore.createOpenStreetMap = function() {

  var projection = ol.Projection.createFromCode('EPSG:3857');
  var tileGrid = ol.tilegrid.createOpenStreetMap(18);
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
      ol.TileUrlFunction.createFromTemplates([
        'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'http://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'http://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ]));
  var extent = projection.getExtent();
  var attribution =
      '&copy; ' +
      '<a href="http://www.openstreetmap.org">OpenStreetMap</a> ' +
      'contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>';
  var crossOrigin = '';

  return new ol.TileStore(
      projection, tileGrid, tileUrlFunction, extent, attribution, crossOrigin);

};


