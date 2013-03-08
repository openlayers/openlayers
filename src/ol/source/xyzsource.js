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
 * @param {ol.source.XYZOptions} xyzOptions XYZ options.
 */
ol.source.XYZ = function(xyzOptions) {

  var projection = xyzOptions.projection ||
      ol.projection.get('EPSG:3857');

  /**
   * @type {ol.TileUrlFunctionType}
   */
  var tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  // FIXME use goog.nullFunction ?
  if (goog.isDef(xyzOptions.tileUrlFunction)) {
    tileUrlFunction = xyzOptions.tileUrlFunction;
  } else if (goog.isDef(xyzOptions.urls)) {
    tileUrlFunction = ol.TileUrlFunction.createFromTemplates(xyzOptions.urls);
  } else if (goog.isDef(xyzOptions.url)) {
    tileUrlFunction = ol.TileUrlFunction.createFromTemplate(xyzOptions.url);
  }

  var tileGrid = new ol.tilegrid.XYZ({
    maxZoom: xyzOptions.maxZoom
  });

  // FIXME factor out common code
  var extent = xyzOptions.extent;
  if (goog.isDefAndNotNull(extent)) {

    tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
        function(tileCoord) {
          if (xyzOptions.maxZoom < tileCoord.z) {
            return null;
          }
          var n = 1 << tileCoord.z;
          var y = -tileCoord.y - 1;
          if (y < 0 || n <= y) {
            return null;
          }
          var x = goog.math.modulo(tileCoord.x, n);
          var tileExtent = tileGrid.getTileCoordExtent(
              new ol.TileCoord(tileCoord.z, x, tileCoord.y));
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
          if (xyzOptions.maxZoom < tileCoord.z) {
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
    attributions: xyzOptions.attributions,
    crossOrigin: xyzOptions.crossOrigin,
    extent: xyzOptions.extent,
    projection: projection,
    tileGrid: tileGrid,
    tileUrlFunction: tileUrlFunction
  });

};
goog.inherits(ol.source.XYZ, ol.source.ImageTileSource);
