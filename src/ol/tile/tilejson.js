// FIXME add some error checking
// FIXME check order of async callbacks
// FIXME use minzoom when supported by ol.TileGrid

/**
 * @see http://mapbox.com/developers/api/
 */

goog.provide('ol.layer.TileJSON');
goog.provide('ol.tilejson');
goog.provide('ol.tilestore.TileJSON');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.net.jsloader');
goog.require('goog.string');
goog.require('ol.TileLayer');
goog.require('ol.TileStore');
goog.require('ol.TileUrlFunction');


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
 * @extends {ol.TileLayer}
 * @param {string} url URL.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol.layer.TileJSON = function(url, opt_values) {
  goog.asserts.assert(goog.string.endsWith(url, '.jsonp'));
  var tileStore = new ol.tilestore.TileJSON(url, function(tileStore) {
    this.dispatchEvent(goog.events.EventType.LOAD);
  }, this);
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol.layer.TileJSON, ol.TileLayer);



/**
 * @constructor
 * @extends {ol.TileStore}
 * @param {string} uri URI.
 * @param {?function(ol.tilestore.TileJSON)=} opt_callback Callback.
 * @param {*=} opt_obj Object.
 */
ol.tilestore.TileJSON = function(uri, opt_callback, opt_obj) {

  var projection = ol.Projection.getFromCode('EPSG:3857');

  goog.base(
      this, projection, null, ol.TileUrlFunction.nullTileUrlFunction, null);

  /**
   * @private
   * @type {?function(ol.tilestore.TileJSON)}
   */
  this.callback_ = opt_callback || null;

  /**
   * @private
   * @type {*}
   */
  this.object_ = opt_obj;

  /**
   * @private
   * @type {boolean}
   */
  this.ready_ = false;

  /**
   * @private
   * @type {!goog.async.Deferred}
   */
  this.deferred_ = goog.net.jsloader.load(uri, {cleanupWhenDone: true});
  this.deferred_.addCallback(this.handleTileJSONResponse, this);

};
goog.inherits(ol.tilestore.TileJSON, ol.TileStore);


/**
 * @protected
 */
ol.tilestore.TileJSON.prototype.handleTileJSONResponse = function() {

  var tileJSON = ol.tilejson.grids_.pop();

  var epsg4326Projection = ol.Projection.getFromCode('EPSG:4326');

  var epsg4326Extent;
  if (goog.isDef(tileJSON.bounds)) {
    var bounds = tileJSON.bounds;
    epsg4326Extent = new ol.Extent(
        bounds[0], bounds[1], bounds[2], bounds[3]);
    this.extent = epsg4326Extent.transform(
        ol.Projection.getTransform(epsg4326Projection, this.getProjection()));
  } else {
    epsg4326Extent = null;
  }

  var scheme = goog.isDef(tileJSON.scheme) || 'xyz';
  if (goog.isDef(tileJSON.scheme)) {
    goog.asserts.assert(tileJSON.scheme == 'xyz');
  }
  var minzoom = tileJSON.minzoom || 0;
  goog.asserts.assert(minzoom === 0); // FIXME
  var maxzoom = tileJSON.maxzoom || 22;
  var tileGrid = new ol.tilegrid.XYZ(maxzoom);
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
        } else {
          var x = goog.math.modulo(tileCoord.x, n);
          return new ol.TileCoord(tileCoord.z, x, y);
        }
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

  if (!goog.isNull(this.callback_)) {
    this.callback_.call(this.object_, this);
    this.callback_ = null;
    this.object_ = null;
  }

};


/**
 * @inheritDoc
 */
ol.tilestore.TileJSON.prototype.isReady = function() {
  return this.ready_;
};
