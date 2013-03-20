// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');


goog.require('goog.array');
goog.require('ol.Extent');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.ImageTileSource');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.TiledWMSOptions} tiledWMSOptions options.
 */
ol.source.TiledWMS = function(tiledWMSOptions) {
  var tileGrid;
  if (goog.isDef(tiledWMSOptions.tileGrid)) {
    tileGrid = tiledWMSOptions.tileGrid;
  }

  var tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  var urls = tiledWMSOptions.urls;
  if (!goog.isDef(urls) && goog.isDef(tiledWMSOptions.url)) {
    urls = ol.TileUrlFunction.expandUrl(tiledWMSOptions.url);
  }
  if (goog.isDef(urls)) {
    var tileUrlFunctions = goog.array.map(
        urls, function(url) {
          return ol.TileUrlFunction.createFromParamsFunction(
              url, tiledWMSOptions.params, ol.source.wms.getUrl);
        });
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        tileUrlFunctions);
  }

  var transparent = goog.isDef(tiledWMSOptions.params['TRANSPARENT']) ?
      tiledWMSOptions.params['TRANSPARENT'] : true;
  var extent = tiledWMSOptions.extent;

  var tileCoordTransform = function(tileCoord, tileGrid, projection) {
    if (tileGrid.getResolutions().length <= tileCoord.z) {
      return null;
    }
    var x = tileCoord.x;
    var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    var projectionExtent = projection.getExtent();
    extent = goog.isDef(extent) ? extent : projectionExtent;

    if (!goog.isNull(extent) && projection.isGlobal() &&
        extent.minX === projectionExtent.minX &&
        extent.maxX === projectionExtent.maxX) {
      var numCols = Math.ceil(
          (extent.maxX - extent.minX) / (tileExtent.maxX - tileExtent.minX));
      x = goog.math.modulo(x, numCols);
      tileExtent = tileGrid.getTileCoordExtent(
          new ol.TileCoord(tileCoord.z, x, tileCoord.y));
    }
    // FIXME We shouldn't need a typecast here.
    if (!tileExtent.intersects(/** @type {ol.Extent} */ (extent))) {
      return null;
    }
    return new ol.TileCoord(tileCoord.z, x, tileCoord.y);
  };

  goog.base(this, {
    attributions: tiledWMSOptions.attributions,
    crossOrigin: tiledWMSOptions.crossOrigin,
    extent: extent,
    tileGrid: tiledWMSOptions.tileGrid,
    opaque: !transparent,
    projection: tiledWMSOptions.projection,
    tileUrlFunction: ol.TileUrlFunction.withTileCoordTransform(
        tileCoordTransform, tileUrlFunction)
  });

};
goog.inherits(ol.source.TiledWMS, ol.source.ImageTileSource);
