goog.provide('ol.source.TileImage');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.ImageTile');
goog.require('ol.TileCoord');
goog.require('ol.TileLoadFunctionType');
goog.require('ol.TileState');
goog.require('ol.TileUrlFunction');
goog.require('ol.TileUrlFunctionType');
goog.require('ol.extent');
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
    state: goog.isDef(options.state) ?
        /** @type {ol.source.State} */ (options.state) : undefined,
    tileGrid: options.tileGrid,
    tilePixelRatio: options.tilePixelRatio,
    wrapX: options.wrapX
  });

  /**
   * @protected
   * @type {ol.TileUrlFunctionType}
   */
  this.tileUrlFunction = goog.isDef(options.tileUrlFunction) ?
      options.tileUrlFunction :
      ol.TileUrlFunction.nullTileUrlFunction;

  /**
   * @protected
   * @type {?string}
   */
  this.crossOrigin =
      goog.isDef(options.crossOrigin) ? options.crossOrigin : null;

  /**
   * @protected
   * @type {ol.TileLoadFunctionType}
   */
  this.tileLoadFunction = goog.isDef(options.tileLoadFunction) ?
      options.tileLoadFunction : ol.source.TileImage.defaultTileLoadFunction;

  /**
   * @protected
   * @type {function(new: ol.ImageTile, ol.TileCoord, ol.TileState, string,
   *        ?string, ol.TileLoadFunctionType)}
   */
  this.tileClass = goog.isDef(options.tileClass) ?
      options.tileClass : ol.ImageTile;

  /**
   * @private
   * @type {Object.<string, *>}
   */
  this.loadRequests_ = {};

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
ol.source.TileImage.prototype.getTile =
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
 * Set the tile load function of the source.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @api
 */
ol.source.TileImage.prototype.setTileLoadFunction = function(tileLoadFunction) {
  this.tileCache.clear();
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
  this.tileUrlFunction = tileUrlFunction;
  this.changed();
};


/**
 * @inheritDoc
 */
ol.source.TileImage.prototype.useTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache.containsKey(tileCoordKey)) {
    this.tileCache.get(tileCoordKey);
  }
};


/**
 * start reloading the visible tiles, using the out-of-band mechanism
 *
 * @param {ol.Map} map A map instance.
 * @api
 */
ol.source.TileImage.prototype.reloadVisibleTilesOutOfBand = function(map) {

  // find all the visible tiles
  var size = map.getSize() || null;
  var viewState = map.getView().getState();
  var extent = ol.extent.getForViewAndSize(
      viewState.center,
      viewState.resolution,
      viewState.rotation,
      size);
  var z = this.tileGrid.getZForResolution(viewState.resolution);
  var tileResolution = this.tileGrid.getResolution(z);
  var tileRange = this.tileGrid.getTileRangeForExtentAndResolution(extent,
      tileResolution);

  // request reloads for all the visible tiles
  for (var x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (var y = tileRange.minY; y <= tileRange.maxY; ++y) {
      var tileCoordKey = this.getKeyZXY(z, x, y);
      this.loadRequests_[tileCoordKey] = { z: z, x: x, y: y };
    }
  }

  // execute the load requests after a little bit
  // this lets multiple load requests in rapid succession overwrite each other
  // it means we end up skipping some load requests entirely if they were
  // immediately succeeded by another request for the same tile
  // if this function is called by a UI slider (which can generate a huge
  // number of requests in a short time), this delay can offer a significant
  // speedup
  var afterDelay = function() {
    this.executeLoadRequests(map, z, tileRange, viewState.projection);
  };
  window.setTimeout(goog.bind(afterDelay, this), 100);
};


/**
 * run the queued out-of-band load requests
 *
 * @param {ol.Map} map A map instance.
 * @param {number} z The zoom.
 * @param {ol.TileRange} tileRange A range of tiles.
 * @param {ol.proj.Projection} projection The map view projection.
 */
ol.source.TileImage.prototype.executeLoadRequests =
    function(map, z, tileRange, projection) {

  var x, y, tileCoordKey;

  if (this.tileCache.getCount() > 0) {
    // clear any tiles that are not visible out of the cache
    // it looks like we can only remove old things from the cache
    // so collect our visible tiles
    var cachedTiles = {};
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
        tileCoordKey = this.getKeyZXY(z, x, y);
        if (this.tileCache.containsKey(tileCoordKey)) {
          cachedTiles[tileCoordKey] = this.tileCache.get(tileCoordKey);
        }
      }
    }

    // clear the cache, then put our tiles back
    this.tileCache.clear();
    for (tileCoordKey in cachedTiles) {
      this.tileCache.set(tileCoordKey, cachedTiles[tileCoordKey]);
    }
  }

  // set up the tile load handler
  var setLoadHandler = function(tileCoordKey, outOfBandTile) {
    var onTileLoad = function() {
      if (outOfBandTile.getState() == ol.TileState.LOADING) {
        // listen again to get the next event
        goog.events.listenOnce(outOfBandTile, goog.events.EventType.CHANGE,
            onTileLoad, false, this);
      } else if (outOfBandTile.getState() == ol.TileState.LOADED ||
          outOfBandTile.getState() == ol.TileState.ERROR) {
        if (this.tileCache.containsKey(tileCoordKey)) {
          // tile loads can come in out of order. make sure we only
          // use the most recent tile
          var cachedTile = this.tileCache.get(tileCoordKey);
          if (outOfBandTile.getSequenceNumber() >
              cachedTile.getSequenceNumber()) {
            // make sure we don't overwrite a newer out-of-band-tile
            outOfBandTile.updateOutOfBandTile(cachedTile);
            // replace the old tile
            this.tileCache.replace(tileCoordKey, outOfBandTile);
          }
        } else {
          // we've never seen this tile before, just add it to the cache
          this.tileCache.set(tileCoordKey, outOfBandTile);
        }
        // make sure the map draws a frame after the tile is loaded
        map.render();
      }
    };
    goog.events.listenOnce(outOfBandTile, goog.events.EventType.CHANGE,
        onTileLoad, false, this);
  };

  // actually execute the tile load requests that are still in the current view
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tileCoordKey = this.getKeyZXY(z, x, y);
      var request = this.loadRequests_[tileCoordKey];
      if (request !== null) {
        var urlTileCoord = this.getTileCoordForTileUrlFunction([z, x, y],
            projection);
        var url = this.tileUrlFunction(urlTileCoord, this.getTilePixelRatio(),
            projection);
        if (this.tileCache.containsKey(tileCoordKey)) {
          // add an out-of-band tile to the tile at this position
          // it will get picked up by the tile queue and loaded some time later
          var cachedTile = this.tileCache.get(tileCoordKey);
          var outOfBandTile = cachedTile.setOutOfBandUrl(url, map);
          setLoadHandler.call(this, tileCoordKey, outOfBandTile);
        } else {
          // there's no tile at this position yet, just ignore this request
        }
      }
    }
  }
  this.loadRequests_ = {};

  // tell the map to render to start processing the tile queue
  map.render();
};
