goog.provide('ol.source.VectorTile');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.TileState');
goog.require('ol.VectorTile');
goog.require('ol.featureloader');
goog.require('ol.source.UrlTile');



/**
 * @classdesc
 * Base class for sources providing images divided into a tile grid.
 *
 * @constructor
 * @fires ol.source.TileEvent
 * @extends {ol.source.UrlTile}
 * @param {olx.source.VectorTileOptions} options Vector tile options.
 * @api
 */
ol.source.VectorTile = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    cacheSize: ol.DEFAULT_TILE_CACHE_HIGH_WATER_MARK / 16,
    extent: options.extent,
    logo: options.logo,
    opaque: options.opaque,
    projection: options.projection,
    state: goog.isDef(options.state) ?
        /** @type {ol.source.State} */ (options.state) : undefined,
    tileGrid: options.tileGrid,
    tileLoadFunction: goog.isDef(options.tileLoadFunction) ?
        options.tileLoadFunction : ol.source.VectorTile.defaultTileLoadFunction,
    tileUrlFunction: options.tileUrlFunction,
    tilePixelRatio: options.tilePixelRatio,
    wrapX: options.wrapX
  });

  this.assumeRightHandedPolygons_ =
      goog.isDef(options.assumeRightHandedPolygons) ?
          options.assumeRightHandedPolygons : false;

  /**
   * @private
   * @type {ol.format.Feature}
   */
  this.format_ = goog.isDef(options.format) ? options.format : null;

  /**
   * @protected
   * @type {function(new: ol.VectorTile, ol.TileCoord, ol.TileState, string,
   *        ol.format.Feature, ol.TileLoadFunctionType)}
   */
  this.tileClass = goog.isDef(options.tileClass) ?
      options.tileClass : ol.VectorTile;

};
goog.inherits(ol.source.VectorTile, ol.source.UrlTile);


/**
 * @return {boolean} Assume right handed polygons.
 */
ol.source.VectorTile.prototype.getRightHandedPolygons = function() {
  return this.assumeRightHandedPolygons_;
};


/**
 * @inheritDoc
 */
ol.source.VectorTile.prototype.getTile =
    function(z, x, y, pixelRatio, projection) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    goog.asserts.assert(projection, 'argument projection is truthy');
    var tileCoord = [z, x, y];
    var urlTileCoord = this.getTileCoordForTileUrlFunction(
        tileCoord, projection);
    var tileUrl = goog.isNull(urlTileCoord) ? undefined :
        this.tileUrlFunction(urlTileCoord, pixelRatio, projection);
    var tile = new this.tileClass(
        tileCoord,
        goog.isDef(tileUrl) ? ol.TileState.IDLE : ol.TileState.EMPTY,
        goog.isDef(tileUrl) ? tileUrl : '',
        this.format_,
        this.tileLoadFunction);
    goog.events.listen(tile, goog.events.EventType.CHANGE,
        this.handleTileChange, false, this);

    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


/**
 * @param {ol.VectorTile} vectorTile Vector tile.
 * @param {string} url URL.
 */
ol.source.VectorTile.defaultTileLoadFunction = function(vectorTile, url) {
  vectorTile.setLoader(ol.featureloader.tile(url, vectorTile.getFormat()));
};
