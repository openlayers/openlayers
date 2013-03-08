// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');


goog.require('goog.array');
goog.require('ol.Extent');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.ImageTileSource');



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

  var tileUrlFunction;
  if (tiledWMSOptions.urls) {
    var tileUrlFunctions = goog.array.map(
        tiledWMSOptions.urls, function(url) {
          return ol.TileUrlFunction.createWMSParams(
              url, tiledWMSOptions.params);
        });
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        tileUrlFunctions);
  } else if (tiledWMSOptions.url) {
    tileUrlFunction = ol.TileUrlFunction.createWMSParams(
        tiledWMSOptions.url, tiledWMSOptions.params);
  } else {
    tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
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
