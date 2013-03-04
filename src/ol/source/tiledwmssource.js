// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');


goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.uri.utils');
goog.require('ol.Extent');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.projection');
goog.require('ol.source.ImageTileSource');



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.TiledWMSOptions} tiledWMSOptions options.
 */
ol.source.TiledWMS = function(tiledWMSOptions) {
  var projection = ol.projection.createProjection(
      tiledWMSOptions.projection, 'EPSG:3857');
  var projectionExtent = projection.getExtent();

  var extent = goog.isDef(tiledWMSOptions.extent) ?
      tiledWMSOptions.extent : projectionExtent;

  var transparent = goog.isDef(tiledWMSOptions.transparent) ?
      tiledWMSOptions.transparent : true;

  var version = goog.isDef(tiledWMSOptions.version) ?
      tiledWMSOptions.version : '1.3';

  var tileGrid;
  if (goog.isDef(tiledWMSOptions.tileGrid)) {
    tileGrid = tiledWMSOptions.tileGrid;
  } else {
    tileGrid = ol.tilegrid.createForProjection(projection,
        tiledWMSOptions.maxZoom);
  }

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': version,
    'REQUEST': 'GetMap',
    'STYLES': '',
    'FORMAT': 'image/png',
    'TRANSPARENT': transparent
  };
  baseParams[version >= '1.3' ? 'CRS' : 'SRS'] = projection.getCode();
  goog.object.extend(baseParams, tiledWMSOptions.params);

  var axisOrientation = projection.getAxisOrientation();
  var tileUrlFunction;
  if (tiledWMSOptions.urls) {
    var tileUrlFunctions = goog.array.map(
        tiledWMSOptions.urls, function(url) {
          url = goog.uri.utils.appendParamsFromMap(url, baseParams);
          return ol.TileUrlFunction.createBboxParam(
              url, tileGrid, axisOrientation);
        });
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        tileUrlFunctions);
  } else if (tiledWMSOptions.url) {
    var url = goog.uri.utils.appendParamsFromMap(
        tiledWMSOptions.url, baseParams);
    tileUrlFunction =
        ol.TileUrlFunction.createBboxParam(url, tileGrid, axisOrientation);
  } else {
    tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  }

  var tileCoordTransform = function(tileCoord) {
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
  };

  goog.base(this, {
    attributions: tiledWMSOptions.attributions,
    crossOrigin: tiledWMSOptions.crossOrigin,
    extent: extent,
    tileGrid: tileGrid,
    opaque: !transparent,
    projection: projection,
    tileUrlFunction: ol.TileUrlFunction.withTileCoordTransform(
        tileCoordTransform, tileUrlFunction)
  });

};
goog.inherits(ol.source.TiledWMS, ol.source.ImageTileSource);
