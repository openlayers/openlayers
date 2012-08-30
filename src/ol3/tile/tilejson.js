// FIXME add some error checking
// FIXME check order of async callbacks
// FIXME use minzoom when supported by ol3.TileGrid

/**
 * @see http://mapbox.com/developers/api/
 */

goog.provide('ol3.layer.TileJSON');
goog.provide('ol3.tilejson');
goog.provide('ol3.tilestore.TileJSON');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.net.jsloader');
goog.require('goog.string');
goog.require('ol3.TileLayer');
goog.require('ol3.TileStore');
goog.require('ol3.TileUrlFunction');


/**
 * @private
 * @type {Array.<TileJSON>}
 */
ol3.tilejson.grids_ = [];


/**
 * @param {TileJSON} tileJSON Tile JSON.
 */
var grid = function(tileJSON) {
  ol3.tilejson.grids_.push(tileJSON);
};
goog.exportSymbol('grid', grid);



/**
 * @constructor
 * @extends {ol3.TileLayer}
 * @param {string} url URL.
 * @param {Object.<string, *>=} opt_values Values.
 */
ol3.layer.TileJSON = function(url, opt_values) {
  goog.asserts.assert(goog.string.endsWith(url, '.jsonp'));
  var tileStore = new ol3.tilestore.TileJSON(url, function(tileStore) {
    this.dispatchEvent(goog.events.EventType.LOAD);
  }, this);
  goog.base(this, tileStore, opt_values);
};
goog.inherits(ol3.layer.TileJSON, ol3.TileLayer);



/**
 * @constructor
 * @extends {ol3.TileStore}
 * @param {string} uri URI.
 * @param {?function(ol3.tilestore.TileJSON)=} opt_callback Callback.
 * @param {*=} opt_obj Object.
 */
ol3.tilestore.TileJSON = function(uri, opt_callback, opt_obj) {

  var projection = ol3.Projection.getFromCode('EPSG:3857');

  goog.base(
      this, projection, null, ol3.TileUrlFunction.nullTileUrlFunction, null);

  /**
   * @private
   * @type {?function(ol3.tilestore.TileJSON)}
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
goog.inherits(ol3.tilestore.TileJSON, ol3.TileStore);


/**
 * @protected
 */
ol3.tilestore.TileJSON.prototype.handleTileJSONResponse = function() {

  var tileJSON = ol3.tilejson.grids_.pop();

  var epsg4326Projection = ol3.Projection.getFromCode('EPSG:4326');

  var epsg4326Extent, extent;
  if (goog.isDef(tileJSON.bounds)) {
    var bounds = tileJSON.bounds;
    epsg4326Extent = new ol3.Extent(
        bounds[0], bounds[1], bounds[2], bounds[3]);
    extent = epsg4326Extent.transform(
        ol3.Projection.getTransform(epsg4326Projection, this.getProjection()));
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
  var tileGrid = new ol3.tilegrid.XYZ(maxzoom);
  this.tileGrid = tileGrid;

  this.tileUrlFunction = ol3.TileUrlFunction.withTileCoordTransform(
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
              new ol3.TileCoord(tileCoord.z, x, tileCoord.y));
          if (!tileExtent.intersects(extent)) {
            return null;
          }
        }
        return new ol3.TileCoord(tileCoord.z, x, y);
      },
      ol3.TileUrlFunction.createFromTemplates(tileJSON.tiles));

  if (goog.isDef(tileJSON.attribution)) {
    var coverageAreas = [
      new ol3.TileCoverageArea(tileGrid, epsg4326Extent, minzoom, maxzoom)
    ];
    var coverageAreaProjection = epsg4326Projection;
    this.setAttributions([
      new ol3.Attribution(
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
ol3.tilestore.TileJSON.prototype.isReady = function() {
  return this.ready_;
};
