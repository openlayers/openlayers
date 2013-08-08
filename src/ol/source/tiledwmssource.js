// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.source.FeatureInfoSource');
goog.require('ol.source.ImageTileSource');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @implements {ol.source.FeatureInfoSource}
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
        extent[0] === projectionExtent[0] &&
        extent[1] === projectionExtent[1]) {
      var numCols = Math.ceil(
          (extent[1] - extent[0]) / (tileExtent[1] - tileExtent[0]));
      x = goog.math.modulo(x, numCols);
      tileExtent = tileGrid.getTileCoordExtent(
          new ol.TileCoord(tileCoord.z, x, tileCoord.y));
    }
    if (!goog.isNull(extent) && !ol.extent.intersects(tileExtent, extent)) {
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

  /**
   * @private
   * @type {ol.source.WMSGetFeatureInfoOptions}
   */
  this.getFeatureInfoOptions_ = goog.isDef(options.getFeatureInfoOptions) ?
      options.getFeatureInfoOptions : {};

};
goog.inherits(ol.source.TiledWMS, ol.source.ImageTileSource);


/**
 * @inheritDoc
 */
ol.source.TiledWMS.prototype.getFeatureInfoForPixel =
    function(pixel, map, success, opt_error) {
  var coord = map.getCoordinateFromPixel(pixel),
      view2D = map.getView().getView2D(),
      projection = view2D.getProjection(),
      tileGrid = goog.isNull(this.tileGrid) ?
          ol.tilegrid.getForProjection(projection) : this.tileGrid,
      tileCoord = tileGrid.getTileCoordForCoordAndResolution(coord,
          view2D.getResolution()),
      tileExtent = tileGrid.getTileCoordExtent(tileCoord),
      offset = map.getPixelFromCoordinate(ol.extent.getTopLeft(tileExtent)),
      url = this.tileUrlFunction(tileCoord, projection);
  goog.asserts.assert(goog.isDef(url),
      'ol.source.TiledWMS#tileUrlFunction does not return a url');
  ol.source.wms.getFeatureInfo(url,
      [pixel[0] - offset[0], pixel[1] - offset[1]], this.getFeatureInfoOptions_,
      success, opt_error);
};
