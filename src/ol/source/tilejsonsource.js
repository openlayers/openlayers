// FIXME add some error checking
// FIXME check order of async callbacks

/**
 * @see http://mapbox.com/developers/api/
 */

goog.provide('ol.source.TileJSON');
goog.provide('ol.tilejson');

goog.require('goog.asserts');
goog.require('goog.net.jsloader');
goog.require('ol.Attribution');
goog.require('ol.TileRange');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.State');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.XYZ');


/**
 * @private
 * @type {Array.<TileJSON>}
 */
ol.tilejson.grids_ = [];


/**
 * @param {TileJSON} tileJSON Tile JSON.
 */
var grid = function(tileJSON) {
  ol.tilejson.grids_.push(tileJSON);
};
goog.exportSymbol('grid', grid);



/**
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {ol.source.TileJSONOptions} options TileJSON options.
 * @todo stability experimental
 */
ol.source.TileJSON = function(options) {

  goog.base(this, {
    crossOrigin: options.crossOrigin,
    projection: ol.proj.get('EPSG:3857'),
    state: ol.source.State.LOADING,
    tileLoadFunction: options.tileLoadFunction
  });

  /**
   * @private
   * @type {!goog.async.Deferred}
   */
  this.deferred_ = goog.net.jsloader.load(options.url, {cleanupWhenDone: true});
  this.deferred_.addCallback(this.handleTileJSONResponse, this);

};
goog.inherits(ol.source.TileJSON, ol.source.TileImage);


/**
 * @protected
 */
ol.source.TileJSON.prototype.handleTileJSONResponse = function() {
  var tileJSON = ol.tilejson.grids_.pop();

  var epsg4326Projection = ol.proj.get('EPSG:4326');

  var extent;
  if (goog.isDef(tileJSON.bounds)) {
    var transform = ol.proj.getTransformFromProjections(
        epsg4326Projection, this.getProjection());
    extent = ol.extent.transform(tileJSON.bounds, transform);
    this.setExtent(extent);
  }

  if (goog.isDef(tileJSON.scheme)) {
    goog.asserts.assert(tileJSON.scheme == 'xyz');
  }
  var minZoom = tileJSON.minzoom || 0;
  var maxZoom = tileJSON.maxzoom || 22;
  var tileGrid = new ol.tilegrid.XYZ({
    maxZoom: maxZoom,
    minZoom: minZoom
  });
  this.tileGrid = tileGrid;

  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      tileGrid.createTileCoordTransform({
        extent: extent
      }),
      ol.TileUrlFunction.createFromTemplates(tileJSON.tiles));

  if (goog.isDef(tileJSON.attribution)) {
    var attributionExtent = goog.isDef(extent) ?
        extent : epsg4326Projection.getExtent();
    /** @type {Object.<string, Array.<ol.TileRange>>} */
    var tileRanges = {};
    var z, zKey;
    for (z = minZoom; z <= maxZoom; ++z) {
      zKey = z.toString();
      tileRanges[zKey] =
          [tileGrid.getTileRangeForExtentAndZ(attributionExtent, z)];
    }
    this.setAttributions([
      new ol.Attribution({
        html: tileJSON.attribution,
        tileRanges: tileRanges
      })
    ]);
  }

  this.setState(ol.source.State.READY);

};
