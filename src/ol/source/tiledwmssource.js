// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');


goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.uri.utils');
goog.require('ol.Extent');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.ImageTileSource');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.TiledWMSOptions} options options.
 */
ol.source.TiledWMS = function(options) {

  /**
   * @private
   * @type {ol.source.TiledWMSOptions}
   */
  this.options_ = options;

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    projection: options.projection,
    tileGrid: options.tileGrid
  });

};
goog.inherits(ol.source.TiledWMS, ol.source.ImageTileSource);


/**
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 */
ol.source.ImageTileSource.prototype.setTileGrid = function(tileGrid) {
  goog.base(this, 'setTileGrid', tileGrid);

  var options = this.options_;
  var version = goog.isDef(options.version) ? options.version : '1.3.0';

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': version,
    'REQUEST': 'GetMap',
    'STYLES': '',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  var projection = this.getProjection(),
      projectionExtent = projection.getExtent(),
      tileSize = tileGrid.getTileSize();
  baseParams['WIDTH'] = tileSize.width;
  baseParams['HEIGHT'] = tileSize.height;
  baseParams[version >= '1.3' ? 'CRS' : 'SRS'] = projection.getCode();
  goog.object.extend(baseParams, options.params);

  var tileUrlFunction;
  if (options.urls) {
    var tileUrlFunctions = goog.array.map(options.urls, function(url) {
      url = goog.uri.utils.appendParamsFromMap(url, baseParams);
      return ol.TileUrlFunction.createBboxParam(url, tileGrid);
    });
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        tileUrlFunctions);
  } else if (options.url) {
    var url = goog.uri.utils.appendParamsFromMap(options.url, baseParams);
    tileUrlFunction = ol.TileUrlFunction.createBboxParam(url, tileGrid);
  } else {
    tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  }
  var extent = goog.isDef(options.extent) ? options.extent : projectionExtent;

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

  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      tileCoordTransform, tileUrlFunction);
};
