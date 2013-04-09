// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.Extent');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.ImageTileSource');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.TiledWMSOptions} options Tiled WMS options.
 */
ol.source.TiledWMS = function(options) {
  var tileGrid;
  if (goog.isDef(options.tileGrid)) {
    tileGrid = options.tileGrid;
  }

  var tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  var urls = options.urls;
  if (!goog.isDef(urls) && goog.isDef(options.url)) {
    urls = ol.TileUrlFunction.expandUrl(options.url);
  }
  if (goog.isDef(urls)) {
    var tileUrlFunctions = goog.array.map(
        urls, function(url) {
          return ol.TileUrlFunction.createFromParamsFunction(
              url, options.params, ol.source.wms.getUrl);
        });
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        tileUrlFunctions);
  }

  var transparent = goog.isDef(options.params['TRANSPARENT']) ?
      options.params['TRANSPARENT'] : true;
  var extent = options.extent;

  var tileCoordTransform = function(tileCoord, projection) {
    var tileGrid = this.getTileGrid();
    if (goog.isNull(tileGrid)) {
      tileGrid = ol.tilegrid.getForProjection(projection);
    }
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
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: extent,
    tileGrid: options.tileGrid,
    opaque: !transparent,
    projection: options.projection,
    tileUrlFunction: ol.TileUrlFunction.withTileCoordTransform(
        tileCoordTransform, tileUrlFunction)
  });

};
goog.inherits(ol.source.TiledWMS, ol.source.ImageTileSource);
