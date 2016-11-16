goog.provide('ol.source.VectorTile');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.VectorTile');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.featureloader');
goog.require('ol.size');
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

  ol.source.UrlTile.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize !== undefined ? options.cacheSize : 128,
    extent: options.extent,
    logo: options.logo,
    opaque: false,
    projection: options.projection,
    state: options.state,
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
   * @private
   * @type {boolean}
   */
  this.overlaps_ = options.overlaps == undefined ? true : options.overlaps;

  /**
   * @protected
   * @type {function(new: ol.VectorTile, ol.TileCoord, ol.Tile.State, string,
   *        ol.format.Feature, ol.TileLoadFunctionType)}
   */
  this.tileClass = options.tileClass ? options.tileClass : ol.VectorTile;

};
ol.inherits(ol.source.VectorTile, ol.source.UrlTile);


/**
 * @return {boolean} The source can have overlapping geometries.
 */
ol.source.VectorTile.prototype.getOverlaps = function() {
  return this.overlaps_;
};


/**
 * @inheritDoc
 */
ol.source.VectorTile.prototype.getTile = function(z, x, y, pixelRatio, projection) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    var tileCoord = [z, x, y];
    var urlTileCoord = this.getTileCoordForTileUrlFunction(
        tileCoord, projection);
    var tileUrl = urlTileCoord ?
        this.tileUrlFunction(urlTileCoord, pixelRatio, projection) : undefined;
    var tile = new this.tileClass(
        tileCoord,
        tileUrl !== undefined ? ol.Tile.State.IDLE : ol.Tile.State.EMPTY,
        tileUrl !== undefined ? tileUrl : '',
        this.format_, this.tileLoadFunction);
    ol.events.listen(tile, ol.events.EventType.CHANGE,
        this.handleTileChange, this);

    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


/**
 * @inheritDoc
 */
ol.source.VectorTile.prototype.getTilePixelRatio = function(opt_pixelRatio) {
  return opt_pixelRatio == undefined ?
      ol.source.UrlTile.prototype.getTilePixelRatio.call(this, opt_pixelRatio) :
      opt_pixelRatio;
};


/**
 * @inheritDoc
 */
ol.source.VectorTile.prototype.getTilePixelSize = function(z, pixelRatio, projection) {
  var tileSize = ol.size.toSize(this.tileGrid.getTileSize(z));
  return [Math.round(tileSize[0] * pixelRatio), Math.round(tileSize[1] * pixelRatio)];
};


/**
 * @param {ol.VectorTile} vectorTile Vector tile.
 * @param {string} url URL.
 */
ol.source.VectorTile.defaultTileLoadFunction = function(vectorTile, url) {
  vectorTile.setLoader(ol.featureloader.tile(url, vectorTile.getFormat()));
};
