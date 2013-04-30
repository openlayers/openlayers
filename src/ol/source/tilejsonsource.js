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
goog.require('ol.projection');
goog.require('ol.source.ImageTileSource');
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
 * @extends {ol.source.ImageTileSource}
 * @param {ol.source.TileJSONOptions} options TileJSON options.
 */
ol.source.TileJSON = function(options) {

  goog.base(this, {
    crossOrigin: options.crossOrigin,
    projection: ol.projection.get('EPSG:3857')
  });

  /**
   * @private
   * @type {boolean}
   */
  this.ready_ = false;

  /**
   * @private
   * @type {!goog.async.Deferred}
   */
  this.deferred_ = goog.net.jsloader.load(options.url, {cleanupWhenDone: true});
  this.deferred_.addCallback(this.handleTileJSONResponse, this);

};
goog.inherits(ol.source.TileJSON, ol.source.ImageTileSource);


/**
 * @protected
 */
ol.source.TileJSON.prototype.handleTileJSONResponse = function() {

  var tileJSON = ol.tilejson.grids_.pop();

  var epsg4326Projection = ol.projection.get('EPSG:4326');

  var extent;
  if (goog.isDef(tileJSON.bounds)) {
    var bounds = tileJSON.bounds;
    var epsg4326Extent = [bounds[0], bounds[2], bounds[1], bounds[3]];
    var transform = ol.projection.getTransformFromProjections(
        epsg4326Projection, this.getProjection());
    extent = ol.extent.transform(epsg4326Extent, transform);
    this.setExtent(extent);
  }

  var scheme = goog.isDef(tileJSON.scheme) || 'xyz';
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
      new ol.Attribution(tileJSON.attribution, tileRanges)
    ]);
  }

  this.ready_ = true;

  this.dispatchLoadEvent();

};


/**
 * @inheritDoc
 */
ol.source.TileJSON.prototype.isReady = function() {
  return this.ready_;
};
