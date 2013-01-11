// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');


goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.uri.utils');
goog.require('ol.Attribution');
goog.require('ol.Projection');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.ImageTileSource');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.TiledWMSOptions} tiledWMSOptions options.
 */
ol.source.TiledWMS = function(tiledWMSOptions) {
  var projection = ol.Projection.createProjection(
      tiledWMSOptions.projection, 'EPSG:3857');
  var projectionExtent = projection.getExtent();

  var extent = goog.isDef(tiledWMSOptions.extent) ?
      tiledWMSOptions.extent : projectionExtent;

  var version = goog.isDef(tiledWMSOptions.version) ?
      tiledWMSOptions.version : '1.3';

  var tileGrid;
  if (goog.isDef(tiledWMSOptions.tileGrid)) {
    tileGrid = tiledWMSOptions.tileGrid;
  } else {
    // FIXME Factor this out to a more central/generic place.
    var size = Math.max(
        projectionExtent.maxX - projectionExtent.minX,
        projectionExtent.maxY - projectionExtent.minY);
    var maxZoom = goog.isDef(tiledWMSOptions.maxZoom) ?
        tiledWMSOptions.maxZoom : 18;
    var resolutions = new Array(maxZoom + 1);
    for (var z = 0, zz = resolutions.length; z < zz; ++z) {
      resolutions[z] = ol.Projection.EPSG_3857_HALF_SIZE / (128 << z);
    }
    tileGrid = new ol.tilegrid.TileGrid({
      origin: projectionExtent.getTopLeft(),
      resolutions: resolutions
    });
  }

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': version,
    'REQUEST': 'GetMap',
    'STYLES': '',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  var tileSize = tileGrid.getTileSize();
  baseParams['WIDTH'] = tileSize.width;
  baseParams['HEIGHT'] = tileSize.height;
  baseParams[version >= '1.3' ? 'CRS' : 'SRS'] = projection.getCode();
  goog.object.extend(baseParams, tiledWMSOptions.params);

  var tileUrlFunction;
  if (tiledWMSOptions.urls) {
    var tileUrlFunctions = goog.array.map(
        tiledWMSOptions.urls, function(url) {
          url = goog.uri.utils.appendParamsFromMap(url, baseParams);
          return ol.TileUrlFunction.createBboxParam(url, tileGrid);
        });
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        tileUrlFunctions);
  } else if (tiledWMSOptions.url) {
    var url = goog.uri.utils.appendParamsFromMap(
        tiledWMSOptions.url, baseParams);
    tileUrlFunction = ol.TileUrlFunction.createBboxParam(url, tileGrid);
  } else {
    tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  }

  function tileCoordTransform(tileCoord) {
    if (tileGrid.getResolutions().length <= tileCoord.z) {
      return null;
    }
    var x = tileCoord.x;
    var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    // FIXME do we want a wrapDateLine param? The code below will break maps
    // with projections that do not span the whole world width.
    if (extent.minX === projectionExtent.minX &&
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
  }

  goog.base(this, {
    attributions: tiledWMSOptions.attributions,
    crossOrigin: tiledWMSOptions.crossOrigin,
    extent: extent,
    tileGrid: tileGrid,
    projection: projection,
    tileUrlFunction: ol.TileUrlFunction.withTileCoordTransform(
        tileCoordTransform, tileUrlFunction)
  });

};
goog.inherits(ol.source.TiledWMS, ol.source.ImageTileSource);
