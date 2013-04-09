// FIXME add minZoom support

goog.provide('ol.source.XYZ');
goog.provide('ol.source.XYZOptions');

goog.require('goog.math');
goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Projection');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.projection');
goog.require('ol.source.ImageTileSource');
goog.require('ol.tilegrid.XYZ');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            crossOrigin: (string|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|undefined),
 *            maxZoom: number,
 *            projection: (ol.Projection|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined)}}
 */
ol.source.XYZOptions;



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.XYZOptions} options XYZ options.
 */
ol.source.XYZ = function(options) {

  var projection = options.projection || ol.projection.get('EPSG:3857');

  /**
   * @type {ol.TileUrlFunctionType}
   */
  var tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  // FIXME use goog.nullFunction ?
  if (goog.isDef(options.tileUrlFunction)) {
    tileUrlFunction = options.tileUrlFunction;
  } else if (goog.isDef(options.urls)) {
    tileUrlFunction = ol.TileUrlFunction.createFromTemplates(options.urls);
  } else if (goog.isDef(options.url)) {
    tileUrlFunction = ol.TileUrlFunction.createFromTemplates(
        ol.TileUrlFunction.expandUrl(options.url));
  }

  var tileGrid = new ol.tilegrid.XYZ({
    maxZoom: options.maxZoom
  });

  // FIXME factor out common code
  var extent = options.extent;
  if (goog.isDefAndNotNull(extent)) {

    var tmpExtent = new ol.Extent(0, 0, 0, 0);
    var tmpTileCoord = new ol.TileCoord(0, 0, 0);
    tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
        function(tileCoord) {
          if (options.maxZoom < tileCoord.z) {
            return null;
          }
          var n = 1 << tileCoord.z;
          var y = -tileCoord.y - 1;
          if (y < 0 || n <= y) {
            return null;
          }
          var x = goog.math.modulo(tileCoord.x, n);
          tmpTileCoord.z = tileCoord.z;
          tmpTileCoord.x = x;
          tmpTileCoord.y = tileCoord.y;
          var tileExtent = tileGrid.getTileCoordExtent(tmpTileCoord, tmpExtent);
          // FIXME we shouldn't need a typecast here
          if (!tileExtent.intersects(/** @type {ol.Extent} */ (extent))) {
            return null;
          }
          return new ol.TileCoord(tileCoord.z, x, y);
        },
        tileUrlFunction);

  } else {

    tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
        function(tileCoord) {
          if (options.maxZoom < tileCoord.z) {
            return null;
          }
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
  }

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    logo: options.logo,
    projection: projection,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction
  });

};
goog.inherits(ol.source.XYZ, ol.source.ImageTileSource);
