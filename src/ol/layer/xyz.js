goog.provide('ol.layer.XYZ');
goog.provide('ol.source.XYZ');
goog.provide('ol.tilegrid.XYZ');

goog.require('goog.math');
goog.require('ol.Attribution');
goog.require('ol.Coordinate');
goog.require('ol.Projection');
goog.require('ol.Size');
goog.require('ol.TileCoord');
goog.require('ol.TileGrid');
goog.require('ol.TileSource');
goog.require('ol.TileUrlFunction');
goog.require('ol.layer.Layer');
goog.require('ol.layer.TileLayer');



/**
 * @constructor
 * @extends {ol.TileGrid}
 * @param {number} maxZoom Maximum zoom.
 * @param {ol.Size=} opt_tileSize Tile size.
 */
ol.tilegrid.XYZ = function(maxZoom, opt_tileSize) {

  var resolutions = new Array(maxZoom + 1);
  var z;
  for (z = 0; z <= maxZoom; ++z) {
    resolutions[z] = ol.Projection.EPSG_3857_HALF_SIZE / (128 << z);
  }

  var extent = ol.Projection.EPSG_3857_EXTENT;
  var origin = new ol.Coordinate(
      -ol.Projection.EPSG_3857_HALF_SIZE, ol.Projection.EPSG_3857_HALF_SIZE);

  goog.base(this, resolutions, extent, origin, opt_tileSize);

};
goog.inherits(ol.tilegrid.XYZ, ol.TileGrid);


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



/**
 * @constructor
 * @extends {ol.layer.TileLayer}
 * @param {number} maxZoom Maximum zoom.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @param {Array.<ol.Attribution>=} opt_attributions Attributions.
 * @param {string=} opt_crossOrigin Cross origin.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.XYZ = function(
    maxZoom, tileUrlFunction, opt_attributions, opt_crossOrigin, opt_values) {
  var tileSource = new ol.source.XYZ(
      maxZoom, tileUrlFunction, opt_attributions, opt_crossOrigin);
  goog.base(this, tileSource, opt_values);
};
goog.inherits(ol.layer.XYZ, ol.layer.TileLayer);



/**
 * @constructor
 * @extends {ol.TileSource}
 * @param {number} maxZoom Maximum zoom.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @param {Array.<ol.Attribution>=} opt_attributions Attributions.
 * @param {string=} opt_crossOrigin Cross origin.
 */
ol.source.XYZ =
    function(maxZoom, tileUrlFunction, opt_attributions, opt_crossOrigin) {

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

  goog.base(this, projection, tileGrid, tileUrlFunction2, extent,
      opt_attributions, opt_crossOrigin);

};
goog.inherits(ol.source.XYZ, ol.TileSource);
