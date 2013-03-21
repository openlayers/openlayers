goog.provide('ol.source.ImageTileSource');
goog.provide('ol.source.ImageTileSourceOptions');

goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.ImageTile');
goog.require('ol.Projection');
goog.require('ol.Tile');
goog.require('ol.TileCache');
goog.require('ol.TileState');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.source.TileSource');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            crossOrigin: (null|string|undefined),
 *            extent: (ol.Extent|undefined),
 *            opaque: (boolean|undefined),
 *            projection: ol.ProjectionLike,
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            tileUrlFunction: (ol.TileUrlFunctionType|undefined)}}
 */
ol.source.ImageTileSourceOptions;



/**
 * @constructor
 * @extends {ol.source.TileSource}
 * @param {ol.source.ImageTileSourceOptions} options Options.
 */
ol.source.ImageTileSource = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    opaque: options.opaque,
    projection: options.projection,
    tileGrid: options.tileGrid
  });

  /**
   * @protected
   * @type {ol.TileUrlFunctionType}
   */
  this.tileUrlFunction = goog.isDef(options.tileUrlFunction) ?
      options.tileUrlFunction :
      ol.TileUrlFunction.nullTileUrlFunction;

  /**
   * @private
   * @type {?string}
   */
  this.crossOrigin_ =
      goog.isDef(options.crossOrigin) ? options.crossOrigin : null;

  /**
   * @private
   * @type {ol.TileCache}
   */
  this.tileCache_ = new ol.TileCache();

};
goog.inherits(ol.source.ImageTileSource, ol.source.TileSource);


/**
 * @inheritDoc
 */
ol.source.ImageTileSource.prototype.canExpireCache = function() {
  return this.tileCache_.canExpireCache();
};


/**
 * @inheritDoc
 */
ol.source.ImageTileSource.prototype.expireCache = function(usedTiles) {
  this.tileCache_.expireCache(usedTiles);
};


/**
 * @inheritDoc
 */
ol.source.ImageTileSource.prototype.getTile =
    function(tileCoord, tileGrid, projection) {
  var key = tileCoord.toString();
  if (this.tileCache_.containsKey(key)) {
    return /** @type {!ol.Tile} */ (this.tileCache_.get(key));
  } else {
    goog.asserts.assert(tileGrid);
    goog.asserts.assert(projection);
    var tileUrl = this.tileUrlFunction(tileCoord, tileGrid, projection);
    var tile = new ol.ImageTile(
        tileCoord,
        goog.isDef(tileUrl) ? ol.TileState.IDLE : ol.TileState.EMPTY,
        goog.isDef(tileUrl) ? tileUrl : '',
        this.crossOrigin_);
    this.tileCache_.set(key, tile);
    return tile;
  }
};


/**
 * @inheritDoc
 */
ol.source.ImageTileSource.prototype.useTile = function(tileCoordKey) {
  if (this.tileCache_.containsKey(tileCoordKey)) {
    this.tileCache_.get(tileCoordKey);
  }
};
