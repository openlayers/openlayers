// FIXME add some error checking
// FIXME check order of async callbacks
// FIXME use minzoom when supported by ol.tilegrid.TileGrid

/**
 * @see http://mapbox.com/developers/api/
 */

goog.provide('ol.source.TileJSON');
goog.provide('ol.tilejson');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.net.jsloader');
goog.require('goog.string');
goog.require('ol.Projection');
goog.require('ol.TileCoverageArea');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.TileSource');


/**
 * @typedef {{uri: string}}
 */
ol.source.TileJSONOptions;


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
 * @extends {ol.source.TileSource}
 * @param {ol.source.TileJSONOptions} tileJsonOptions TileJSON optios.
 */
ol.source.TileJSON = function(tileJsonOptions) {

  goog.base(this, {
    projection: ol.Projection.getFromCode('EPSG:3857')
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
  this.deferred_ =
      goog.net.jsloader.load(tileJsonOptions.uri, {cleanupWhenDone: true});
  this.deferred_.addCallback(this.handleTileJSONResponse, this);

};
goog.inherits(ol.source.TileJSON, ol.source.TileSource);


/**
 * @protected
 */
ol.source.TileJSON.prototype.handleTileJSONResponse = function() {

  var tileJSON = ol.tilejson.grids_.pop();

  var epsg4326Projection = ol.Projection.getFromCode('EPSG:4326');

  var epsg4326Extent, extent;
  if (goog.isDef(tileJSON.bounds)) {
    var bounds = tileJSON.bounds;
    epsg4326Extent = new ol.Extent(
        bounds[0], bounds[1], bounds[2], bounds[3]);
    extent = epsg4326Extent.transform(
        ol.Projection.getTransform(epsg4326Projection, this.getProjection()));
    this.setExtent(extent);
  } else {
    epsg4326Extent = null;
    extent = null;
  }

  var scheme = goog.isDef(tileJSON.scheme) || 'xyz';
  if (goog.isDef(tileJSON.scheme)) {
    goog.asserts.assert(tileJSON.scheme == 'xyz');
  }
  var minzoom = tileJSON.minzoom || 0;
  goog.asserts.assert(minzoom === 0); // FIXME
  var maxzoom = tileJSON.maxzoom || 22;
  var tileGrid = new ol.tilegrid.XYZ({
    maxZoom: maxzoom
  });
  this.tileGrid = tileGrid;

  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      function(tileCoord) {
        if (tileCoord.z < minzoom || maxzoom < tileCoord.z) {
          return null;
        }
        var n = 1 << tileCoord.z;
        var y = -tileCoord.y - 1;
        if (y < 0 || n <= y) {
          return null;
        }
        var x = goog.math.modulo(tileCoord.x, n);
        if (!goog.isNull(extent)) {
          var tileExtent = tileGrid.getTileCoordExtent(
              new ol.TileCoord(tileCoord.z, x, tileCoord.y));
          if (!tileExtent.intersects(extent)) {
            return null;
          }
        }
        return new ol.TileCoord(tileCoord.z, x, y);
      },
      ol.TileUrlFunction.createFromTemplates(tileJSON.tiles));

  if (goog.isDef(tileJSON.attribution)) {
    var coverageAreas = [
      new ol.TileCoverageArea(tileGrid, epsg4326Extent, minzoom, maxzoom)
    ];
    var coverageAreaProjection = epsg4326Projection;
    this.setAttributions([
      new ol.Attribution(
          tileJSON.attribution, coverageAreas, coverageAreaProjection)
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
