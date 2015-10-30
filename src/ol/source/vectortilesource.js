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
 * Class for layer sources providing vector data divided into a tile grid, to be
 * used with {@link ol.layer.VectorTile}. Although this source receives tiles
 * with vector features from the server, it is not meant for feature editing.
 * Features are optimized for rendering, their geometries are clipped at or near
 * tile boundaries and simplified for a view resolution. See
 * {@link ol.source.Vector} for vector sources that are suitable for feature
 * editing.
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
    state: options.state ?
        /** @type {ol.source.State} */ (options.state) : undefined,
    tileGrid: options.tileGrid,
    tileLoadFunction: options.tileLoadFunction ?
        options.tileLoadFunction : ol.source.VectorTile.defaultTileLoadFunction,
    tileUrlFunction: options.tileUrlFunction,
    tilePixelRatio: options.tilePixelRatio,
    url: options.url,
    urls: options.urls,
    wrapX: options.wrapX === undefined ? true : options.wrapX
  });

  /**
   * @private
   * @type {ol.format.Feature}
   */
  this.format_ = options.format ? options.format : null;

  /**
   * @protected
   * @type {function(new: ol.VectorTile, ol.TileCoord, ol.TileState, string,
   *        ol.format.Feature, ol.TileLoadFunctionType)}
   */
  this.tileClass = options.tileClass ? options.tileClass : ol.VectorTile;

};
goog.inherits(ol.source.VectorTile, ol.source.UrlTile);


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
    var tileUrl = urlTileCoord ?
        this.tileUrlFunction(urlTileCoord, pixelRatio, projection) : undefined;
    var tile = new this.tileClass(
        tileCoord,
        tileUrl !== undefined ? ol.TileState.IDLE : ol.TileState.EMPTY,
        tileUrl !== undefined ? tileUrl : '',
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
