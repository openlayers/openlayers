goog.provide('ol.source.XYZ');

goog.require('ol.Attribution');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.XYZ');



/**
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {ol.source.XYZOptions} options XYZ options.
 */
ol.source.XYZ = function(options) {

  var projection = options.projection || ol.proj.get('EPSG:3857');

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

  var maxZoom = goog.isDef(options.maxZoom) ? options.maxZoom : 18;

  var tileGrid = new ol.tilegrid.XYZ({
    maxZoom: maxZoom
  });

  var tileCoordTransform = tileGrid.createTileCoordTransform({
    extent: options.extent
  });

  tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      tileCoordTransform, tileUrlFunction);

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
goog.inherits(ol.source.XYZ, ol.source.TileImage);
