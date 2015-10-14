goog.provide('ol.source.TileImage');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.ImageTile');
goog.require('ol.TileCache');
goog.require('ol.TileCoord');
goog.require('ol.TileLoadFunctionType');
goog.require('ol.TileState');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.proj');
goog.require('ol.reproj.Tile');
goog.require('ol.source.Tile');
goog.require('ol.source.TileEvent');



/**
 * @classdesc
 * Base class for sources providing images divided into a tile grid.
 *
 * @constructor
 * @fires ol.source.TileEvent
 * @extends {ol.source.Tile}
 * @param {olx.source.TileImageOptions} options Image tile options.
 * @api
 */
ol.source.TileImage = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    opaque: options.opaque,
    projection: options.projection,
    state: options.state !== undefined ?
        /** @type {ol.source.State} */ (options.state) : undefined,
    tileGrid: options.tileGrid,
    tilePixelRatio: options.tilePixelRatio,
    wrapX: options.wrapX
  });

  /**
   * @protected
   * @type {ol.TileUrlFunctionType}
   */
  this.tileUrlFunction = options.tileUrlFunction !== undefined ?
      options.tileUrlFunction :
      ol.TileUrlFunction.nullTileUrlFunction;

  /**
   * @protected
   * @type {?string}
   */
  this.crossOrigin =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

  /**
   * @protected
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction = options.tileLoadFunction !== undefined ?
      options.tileLoadFunction : ol.source.TileImage.defaultTileLoadFunction;

  /**
   * @protected
   * @type {function(new: ol.ImageTile, ol.TileCoord, ol.TileState, string,
   *        ?string, ol.TileLoadFunctionType)}
   */
  this.tileClass = options.tileClass !== undefined ?
      options.tileClass : ol.ImageTile;

  /**
   * @protected
   * @type {Object.<string, ol.TileCache>}
   */
  this.tileCacheForProjection = {};

  /**
   * @protected
   * @type {Object.<string, ol.tilegrid.TileGrid>}
   */
  this.tileGridForProjection = {};

  /**
   * @private
   * @type {number|undefined}
   */
  this.reprojectionErrorThreshold_ = options.reprojectionErrorThreshold;

  /**
   * @private
   * @type {boolean}
   */
  this.renderReprojectionEdges_ = false;
};
goog.inherits(ol.source.TileImage, ol.source.Tile);


/**
 * @param {ol.ImageTile} imageTile Image tile.
 * @param {string} src Source.
 */
ol.source.TileImage.defaultTileLoadFunction = function(imageTile, src) {
  imageTile.getImage().src = src;
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.canExpireCache = function() {
  if (!ol.ENABLE_RASTER_REPROJECTION) {
    return goog.base(this, 'canExpireCache');
  }
  var canExpire = this.tileCache.canExpireCache();
  if (canExpire) {
    return true;
  } else {
    return goog.object.some(this.tileCacheForProjection, function(tileCache) {
      return tileCache.canExpireCache();
    });
  }
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.expireCache = function(projection, usedTiles) {
  if (!ol.ENABLE_RASTER_REPROJECTION) {
    goog.base(this, 'expireCache', projection, usedTiles);
    return;
  }
  var usedTileCache = this.getTileCacheForProjection(projection);

  this.tileCache.expireCache(this.tileCache == usedTileCache ? usedTiles : {});
  goog.object.forEach(this.tileCacheForProjection, function(tileCache) {
    tileCache.expireCache(tileCache == usedTileCache ? usedTiles : {});
  });
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.getTileGridForProjection = function(projection) {
  if (!ol.ENABLE_RASTER_REPROJECTION) {
    return goog.base(this, 'getTileGridForProjection', projection);
  }
  var thisProj = this.getProjection();
  if (this.tileGrid &&
      (!thisProj || ol.proj.equivalent(thisProj, projection))) {
    return this.tileGrid;
  } else {
    var projKey = goog.getUid(projection).toString();
    if (!(projKey in this.tileGridForProjection)) {
      this.tileGridForProjection[projKey] =
          ol.tilegrid.getForProjection(projection);
    }
    return this.tileGridForProjection[projKey];
  }
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.getTileCacheForProjection = function(projection) {
  if (!ol.ENABLE_RASTER_REPROJECTION) {
    return goog.base(this, 'getTileCacheForProjection', projection);
  }
  var thisProj = this.getProjection();
  if (!thisProj || ol.proj.equivalent(thisProj, projection)) {
    return this.tileCache;
  } else {
    var projKey = goog.getUid(projection).toString();
    if (!(projKey in this.tileCacheForProjection)) {
      this.tileCacheForProjection[projKey] = new ol.TileCache();
    }
    return this.tileCacheForProjection[projKey];
  }
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.getTile =
    function(z, x, y, pixelRatio, projection) {
  if (!ol.ENABLE_RASTER_REPROJECTION ||
      !this.getProjection() ||
      !projection ||
      ol.proj.equivalent(this.getProjection(), projection)) {
    return this.getTileInternal(z, x, y, pixelRatio, projection);
  } else {
    var cache = this.getTileCacheForProjection(projection);
    var tileCoordKey = this.getKeyZXY(z, x, y);
    if (cache.containsKey(tileCoordKey)) {
      return /** @type {!ol.Tile} */(cache.get(tileCoordKey));
    } else {
      var sourceProjection = this.getProjection();
      var sourceTileGrid = this.getTileGridForProjection(sourceProjection);
      var targetTileGrid = this.getTileGridForProjection(projection);
      var tile = new ol.reproj.Tile(
          sourceProjection, sourceTileGrid,
          projection, targetTileGrid,
          z, x, y, this.getTilePixelRatio(),
          goog.bind(function(z, x, y, pixelRatio) {
            return this.getTileInternal(z, x, y, pixelRatio, sourceProjection);
          }, this), this.reprojectionErrorThreshold_,
          this.renderReprojectionEdges_);

      cache.set(tileCoordKey, tile);
      return tile;
    }
  }
};


/**
 * @param {number} z Tile coordinate z.
 * @param {number} x Tile coordinate x.
 * @param {number} y Tile coordinate y.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {!ol.Tile} Tile.
 * @protected
 */
ol.source.TileImage.prototype.getTileInternal =
    function(z, x, y, pixelRatio, projection) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    return /** @type {!ol.Tile} */ (this.tileCache.get(tileCoordKey));
  } else {
    goog.asserts.assert(projection, 'argument projection is truthy');
    var tileCoord = [z, x, y];
    var urlTileCoord = this.getTileCoordForTileUrlFunction(
        tileCoord, projection);
    var tileUrl = !urlTileCoord ? undefined :
        this.tileUrlFunction(urlTileCoord, pixelRatio, projection);
    var tile = new this.tileClass(
        tileCoord,
        tileUrl !== undefined ? ol.TileState.IDLE : ol.TileState.EMPTY,
        tileUrl !== undefined ? tileUrl : '',
        this.crossOrigin,
        this.tileLoadFunction);
    goog.events.listen(tile, goog.events.EventType.CHANGE,
        this.handleTileChange_, false, this);

    this.tileCache.set(tileCoordKey, tile);
    return tile;
  }
};


/**
 * Return the tile load function of the source.
 * @return {ol.TileLoadFunctionType} TileLoadFunction
 * @api
 */
ol.source.TileImage.prototype.getTileLoadFunction = function() {
  return this.tileLoadFunction;
};


/**
 * Return the tile URL function of the source.
 * @return {ol.TileUrlFunctionType} TileUrlFunction
 * @api
 */
ol.source.TileImage.prototype.getTileUrlFunction = function() {
  return this.tileUrlFunction;
};


/**
 * Handle tile change events.
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.source.TileImage.prototype.handleTileChange_ = function(event) {
  var tile = /** @type {ol.Tile} */ (event.target);
  switch (tile.getState()) {
    case ol.TileState.LOADING:
      this.dispatchEvent(
          new ol.source.TileEvent(ol.source.TileEventType.TILELOADSTART, tile));
      break;
    case ol.TileState.LOADED:
      this.dispatchEvent(
          new ol.source.TileEvent(ol.source.TileEventType.TILELOADEND, tile));
      break;
    case ol.TileState.ERROR:
      this.dispatchEvent(
          new ol.source.TileEvent(ol.source.TileEventType.TILELOADERROR, tile));
      break;
  }
};


/**
 * Sets whether to render reprojection edges or not (usually for debugging).
 * @param {boolean} render Render the edges.
 * @api
 */
ol.source.TileImage.prototype.setRenderReprojectionEdges = function(render) {
  if (!ol.ENABLE_RASTER_REPROJECTION ||
      this.renderReprojectionEdges_ == render) {
    return;
  }
  this.renderReprojectionEdges_ = render;
  goog.object.forEach(this.tileCacheForProjection, function(tileCache) {
    tileCache.clear();
  });
  this.changed();
};


/**
 * Sets the tile grid to use when reprojecting the tiles to the given
 * projection instead of the default tile grid for the projection.
 *
 * This can be useful when the default tile grid cannot be created
 * (e.g. projection has no extent defined) or
 * for optimization reasons (custom tile size, resolutions, ...).
 *
 * @param {ol.proj.ProjectionLike} projection Projection.
 * @param {ol.tilegrid.TileGrid} tilegrid Tile grid to use for the projection.
 * @api
 */
ol.source.TileImage.prototype.setTileGridForProjection =
    function(projection, tilegrid) {
  if (ol.ENABLE_RASTER_REPROJECTION) {
    var proj = ol.proj.get(projection);
    if (proj) {
      var projKey = goog.getUid(proj).toString();
      if (!(projKey in this.tileGridForProjection)) {
        this.tileGridForProjection[projKey] = tilegrid;
      }
    }
  }
};


/**
 * Set the tile load function of the source.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @api
 */
ol.source.TileImage.prototype.setTileLoadFunction = function(tileLoadFunction) {
  this.tileCache.clear();
  this.tileCacheForProjection = {};
  this.tileLoadFunction = tileLoadFunction;
  this.changed();
};


/**
 * Set the tile URL function of the source.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @api
 */
ol.source.TileImage.prototype.setTileUrlFunction = function(tileUrlFunction) {
  // FIXME It should be possible to be more intelligent and avoid clearing the
  // FIXME cache.  The tile URL function would need to be incorporated into the
  // FIXME cache key somehow.
  this.tileCache.clear();
  this.tileCacheForProjection = {};
  this.tileUrlFunction = tileUrlFunction;
  this.changed();
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.useTile = function(z, x, y, projection) {
  var tileCache = this.getTileCacheForProjection(projection);
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (tileCache && tileCache.containsKey(tileCoordKey)) {
    tileCache.get(tileCoordKey);
  }
};
