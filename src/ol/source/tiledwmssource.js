// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');


goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.uri.utils');
goog.require('ol.Extent');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.IWMS');
goog.require('ol.source.ImageTileSource');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.ImageTileSource}
 * @implements {ol.source.IWMS}
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
 * @inheritDoc
 */
ol.source.TiledWMS.prototype.setProjection = function(projection) {
  goog.base(this, 'setProjection', projection);
  if (goog.isNull(this.tileGrid)) {
    this.setTileGrid(ol.tilegrid.createForProjection(projection));
  }
};


/**
 * @inheritDoc
 */
ol.source.TiledWMS.prototype.setTileGrid = function(tileGrid) {
  goog.base(this, 'setTileGrid', tileGrid);
  this.updateUrlFunction();
};


/**
 * @inheritDoc
 */
ol.source.TiledWMS.prototype.updateUrlFunction = function(opt_params) {
  var params = goog.isDef(opt_params) ? opt_params : {};
  goog.object.extend(params, ol.source.wms.getBaseParams(this));
  var tileSize = this.tileGrid.getTileSize();
  params['WIDTH'] = tileSize.width;
  params['HEIGHT'] = tileSize.height;

  var tileUrlFunction;
  var options = this.options_,
      tileGrid = this.tileGrid,
      projectionExtent = this.getProjection().getExtent();
  if (options.urls) {
    var tileUrlFunctions = goog.array.map(options.urls, function(url) {
      url = goog.uri.utils.appendParamsFromMap(url, params);
      return ol.TileUrlFunction.createBboxParam(url, tileGrid);
    });
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        tileUrlFunctions);
  } else if (options.url) {
    var url = goog.uri.utils.appendParamsFromMap(options.url, params);
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
