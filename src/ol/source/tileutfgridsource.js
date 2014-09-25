goog.provide('ol.source.TileUTFGrid');

goog.require('goog.net.Jsonp');
goog.require('ol.Attribution');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.Tile');
goog.require('ol.tilegrid.TileGrid');
goog.require('ol.tilegrid.XYZ');



/**
 * @classdesc
 * TODO: desc
 * TODO: caching
 * TODO: getTilePixelSize ?
 *
 * @constructor
 * @extends {ol.source.Tile}
 * @param {olx.source.TileUTFGridOptions} options Source options.
 * @api
 */
ol.source.TileUTFGrid = function(options) {
  goog.base(this, {
    projection: ol.proj.get('EPSG:3857'),
    state: ol.source.State.LOADING
  });

  /**
   * @protected
   * @type {ol.TileCache}
   */
  this.tileCache = new ol.TileCache();

  var request = new goog.net.Jsonp(options.url);
  request.send(undefined, goog.bind(this.handleTileJSONResponse, this));
};
goog.inherits(ol.source.TileUTFGrid, ol.source.Tile);


/**
 * @inheritDoc
 */
ol.source.TileUTFGrid.prototype.canExpireCache = function() {
  return this.tileCache.canExpireCache();
};


/**
 * @inheritDoc
 */
ol.source.TileUTFGrid.prototype.expireCache = function(usedTiles) {
  this.tileCache.expireCache(usedTiles);
};


/**
 * TODO: very similar to ol.source.TileJSON#handleTileJSONResponse
 * @protected
 * @param {TileJSON} tileJSON Tile JSON.
 */
ol.source.TileUTFGrid.prototype.handleTileJSONResponse = function(tileJSON) {

  var epsg4326Projection = ol.proj.get('EPSG:4326');

  var sourceProjection = this.getProjection();
  var extent;
  if (goog.isDef(tileJSON.bounds)) {
    var transform = ol.proj.getTransformFromProjections(
        epsg4326Projection, sourceProjection);
    extent = ol.extent.applyTransform(tileJSON.bounds, transform);
  }

  if (goog.isDef(tileJSON.scheme)) {
    goog.asserts.assert(tileJSON.scheme == 'xyz');
  }
  var minZoom = tileJSON.minzoom || 0;
  var maxZoom = tileJSON.maxzoom || 22;
  var tileGrid = new ol.tilegrid.XYZ({
    extent: ol.tilegrid.extentFromProjection(sourceProjection),
    maxZoom: maxZoom,
    minZoom: minZoom
  });
  this.tileGrid = tileGrid;

  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      tileGrid.createTileCoordTransform({
        extent: extent
      }),
      ol.TileUrlFunction.createFromTemplates(tileJSON.grids));

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


/**
 * @inheritDoc
 */
ol.source.TileUTFGrid.prototype.getTile =
    function(z, x, y, pixelRatio, projection) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    goog.asserts.assert(projection);
    var tileCoord = [z, x, y];
    var tileUrl = this.tileUrlFunction(tileCoord, pixelRatio, projection);
    var tile = new ol.source.TileUTFGridTile_(
        tileCoord,
        goog.isDef(tileUrl) ? ol.TileState.IDLE : ol.TileState.EMPTY,
        goog.isDef(tileUrl) ? tileUrl : '');
    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


/**
 * @inheritDoc
 */
ol.source.TileUTFGrid.prototype.useTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    this.tileCache.get(tileCoordKey);
  }
};



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Image source URI.
 * @private
 */
ol.source.TileUTFGridTile_ = function(tileCoord, state, src) {

  goog.base(this, tileCoord, state);

  /**
   * @private
   * @type {string}
   */
  this.src_ = src;

  /**
   * @private
   * @type {?Object}
   */
  this.data_ = null;
};
goog.inherits(ol.source.TileUTFGridTile_, ol.Tile);


/**
 * @inheritDoc
 */
ol.source.TileUTFGridTile_.prototype.getImage = goog.nullFunction;


/**
 * @inheritDoc
 */
ol.source.TileUTFGridTile_.prototype.getKey = function() {
  return this.src_;
};


/**
 * @private
 */
ol.source.TileUTFGridTile_.prototype.handleError_ = function() {
  this.state = ol.TileState.ERROR;
  this.changed();
};


/**
 * @param {Object} json
 * @private
 */
ol.source.TileUTFGridTile_.prototype.handleLoad_ = function(json) {
  this.data_ = json;

  this.state = ol.TileState.EMPTY;
  this.changed();
};


/**
 * Load not yet loaded URI.
 */
ol.source.TileUTFGridTile_.prototype.load = function() {
  if (this.state == ol.TileState.IDLE) {
    this.state = ol.TileState.LOADING;
    var request = new goog.net.Jsonp(this.src_);
    request.send(undefined, goog.bind(this.handleLoad_, this),
                 goog.bind(this.handleError_, this));
  }
};
