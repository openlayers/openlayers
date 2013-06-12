goog.provide('ol.source.XYZ');
goog.provide('ol.source.XYZOptions');

goog.require('ol.Attribution');
goog.require('ol.Projection');
goog.require('ol.TileURLFunction');
goog.require('ol.TileURLFunctionType');
goog.require('ol.proj');
goog.require('ol.source.ImageTileSource');
goog.require('ol.tilegrid.XYZ');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            crossOrigin: (string|undefined),
 *            extent: (ol.Extent|undefined),
 *            logo: (string|undefined),
 *            maxZoom: number,
 *            minZoom: (number|undefined),
 *            projection: (ol.Projection|undefined),
 *            tileURLFunction: (ol.TileURLFunctionType|undefined),
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

  var projection = options.projection || ol.proj.get('EPSG:3857');

  /**
   * @type {ol.TileURLFunctionType}
   */
  var tileURLFunction = ol.TileURLFunction.nullTileURLFunction;
  // FIXME use goog.nullFunction ?
  if (goog.isDef(options.tileURLFunction)) {
    tileURLFunction = options.tileURLFunction;
  } else if (goog.isDef(options.urls)) {
    tileURLFunction = ol.TileURLFunction.createFromTemplates(options.urls);
  } else if (goog.isDef(options.url)) {
    tileURLFunction = ol.TileURLFunction.createFromTemplates(
        ol.TileURLFunction.expandUrl(options.url));
  }

  var tileGrid = new ol.tilegrid.XYZ({
    maxZoom: options.maxZoom,
    minZoom: options.minZoom
  });

  var tileCoordTransform = tileGrid.createTileCoordTransform({
    extent: options.extent
  });

  tileURLFunction = ol.TileURLFunction.withTileCoordTransform(
      tileCoordTransform, tileURLFunction);

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    logo: options.logo,
    projection: projection,
    tileGrid: tileGrid,
    tileURLFunction: tileURLFunction
  });

};
goog.inherits(ol.source.XYZ, ol.source.ImageTileSource);
