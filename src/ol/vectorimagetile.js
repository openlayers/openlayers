goog.provide('ol.VectorImageTile');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.events');
goog.require('ol.extent');
goog.require('ol.events.EventType');
goog.require('ol.featureloader');


/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.TileState} state State.
 * @param {string} src Data source url.
 * @param {ol.format.Feature} format Feature format.
 * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
 * @param {ol.TileCoord} urlTileCoord Wrapped tile coordinate for source urls.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile url function.
 * @param {ol.tilegrid.TileGrid} sourceTileGrid Tile grid of the source.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid of the renderer.
 * @param {Object.<string,ol.VectorTile>} sourceTiles Source tiles.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @param {function(new: ol.VectorTile, ol.TileCoord, ol.TileState, string,
 *     ol.format.Feature, ol.TileLoadFunctionType)} tileClass Class to
 *     instantiate for source tiles.
 * @param {function(this: ol.source.VectorTile, ol.events.Event)} handleTileChange
 *     Function to call when a source tile's state changes.
 * @param {olx.TileOptions=} opt_options Tile options.
 */
ol.VectorImageTile = function(tileCoord, state, src, format, tileLoadFunction,
    urlTileCoord, tileUrlFunction, sourceTileGrid, tileGrid, sourceTiles,
    pixelRatio, projection, tileClass, handleTileChange, opt_options) {

  ol.Tile.call(this, tileCoord, state, opt_options);

  /**
   * @private
   * @type {Object.<string, CanvasRenderingContext2D>}
   */
  this.context_ = {};

  /**
   * @private
   * @type {ol.FeatureLoader}
   */
  this.loader_;

  /**
   * @private
   * @type {Object.<string, ol.TileReplayState>}
   */
  this.replayState_ = {};

  /**
   * @private
   * @type {Object.<string,ol.VectorTile>}
   */
  this.sourceTiles_ = sourceTiles;

  /**
   * Keys of source tiles used by this tile. Use with {@link #getTile}.
   * @type {Array.<string>}
   */
  this.tileKeys = [];

  /**
   * @type {string}
   */
  this.src_ = src;

  /**
   * @type {ol.TileCoord}
   */
  this.wrappedTileCoord = urlTileCoord;

  /**
   * @type {Array.<ol.EventsKey>}
   */
  this.loadListenerKeys_ = [];

  /**
   * @type {Array.<ol.EventsKey>}
   */
  this.sourceTileListenerKeys_ = [];

  if (urlTileCoord) {
    var extent = tileGrid.getTileCoordExtent(urlTileCoord);
    var resolution = tileGrid.getResolution(tileCoord[0]);
    var sourceZ = sourceTileGrid.getZForResolution(resolution);
    sourceTileGrid.forEachTileCoord(extent, sourceZ, function(sourceTileCoord) {
      var sharedExtent = ol.extent.getIntersection(extent,
          sourceTileGrid.getTileCoordExtent(sourceTileCoord));
      var sourceExtent = sourceTileGrid.getExtent();
      if (sourceExtent) {
        sharedExtent = ol.extent.getIntersection(sharedExtent, sourceExtent);
      }
      if (ol.extent.getWidth(sharedExtent) / resolution >= 0.5 &&
          ol.extent.getHeight(sharedExtent) / resolution >= 0.5) {
        // only include source tile if overlap is at least 1 pixel
        var sourceTileKey = sourceTileCoord.toString();
        var sourceTile = sourceTiles[sourceTileKey];
        if (!sourceTile) {
          var tileUrl = tileUrlFunction(sourceTileCoord, pixelRatio, projection);
          sourceTile = sourceTiles[sourceTileKey] = new tileClass(sourceTileCoord,
              tileUrl == undefined ? ol.TileState.EMPTY : ol.TileState.IDLE,
              tileUrl == undefined ? '' : tileUrl,
              format, tileLoadFunction);
          this.sourceTileListenerKeys_.push(
              ol.events.listen(sourceTile, ol.events.EventType.CHANGE, handleTileChange));
        }
        sourceTile.consumers++;
        this.tileKeys.push(sourceTileKey);
      }
    }.bind(this));
  }

};
ol.inherits(ol.VectorImageTile, ol.Tile);


/**
 * @inheritDoc
 */
ol.VectorImageTile.prototype.disposeInternal = function() {
  for (var i = 0, ii = this.tileKeys.length; i < ii; ++i) {
    var sourceTileKey = this.tileKeys[i];
    var sourceTile = this.getTile(sourceTileKey);
    sourceTile.consumers--;
    if (sourceTile.consumers == 0) {
      delete this.sourceTiles_[sourceTileKey];
      sourceTile.dispose();
    }
  }
  this.tileKeys.length = 0;
  this.sourceTiles_ = null;
  this.loadListenerKeys_.forEach(ol.events.unlistenByKey);
  this.loadListenerKeys_.length = 0;
  if (this.interimTile) {
    this.interimTile.dispose();
  }
  this.state = ol.TileState.ABORT;
  this.changed();
  this.sourceTileListenerKeys_.forEach(ol.events.unlistenByKey);
  this.sourceTileListenerKeys_.length = 0;
  ol.Tile.prototype.disposeInternal.call(this);
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @return {CanvasRenderingContext2D} The rendering context.
 */
ol.VectorImageTile.prototype.getContext = function(layer) {
  var key = ol.getUid(layer).toString();
  if (!(key in this.context_)) {
    this.context_[key] = ol.dom.createCanvasContext2D();
  }
  return this.context_[key];
};


/**
 * Get the Canvas for this tile.
 * @param {ol.layer.Layer} layer Layer.
 * @return {HTMLCanvasElement} Canvas.
 */
ol.VectorImageTile.prototype.getImage = function(layer) {
  return this.getReplayState(layer).renderedTileRevision == -1 ?
    null : this.getContext(layer).canvas;
};


/**
 * @param {ol.layer.Layer} layer Layer.
 * @return {ol.TileReplayState} The replay state.
 */
ol.VectorImageTile.prototype.getReplayState = function(layer) {
  var key = ol.getUid(layer).toString();
  if (!(key in this.replayState_)) {
    this.replayState_[key] = {
      dirty: false,
      renderedRenderOrder: null,
      renderedRevision: -1,
      renderedTileRevision: -1
    };
  }
  return this.replayState_[key];
};


/**
 * @inheritDoc
 */
ol.VectorImageTile.prototype.getKey = function() {
  return this.tileKeys.join('/') + '/' + this.src_;
};


/**
 * @param {string} tileKey Key (tileCoord) of the source tile.
 * @return {ol.VectorTile} Source tile.
 */
ol.VectorImageTile.prototype.getTile = function(tileKey) {
  return this.sourceTiles_[tileKey];
};


/**
 * @inheritDoc
 */
ol.VectorImageTile.prototype.load = function() {
  // Source tiles with LOADED state - we just count them because once they are
  // loaded, we're no longer listening to state changes.
  var leftToLoad = 0;
  // Source tiles with ERROR state - we track them because they can still have
  // an ERROR state after another load attempt.
  var errorSourceTiles = {};

  if (this.state == ol.TileState.IDLE) {
    this.setState(ol.TileState.LOADING);
  }
  if (this.state == ol.TileState.LOADING) {
    this.tileKeys.forEach(function(sourceTileKey) {
      var sourceTile = this.getTile(sourceTileKey);
      if (sourceTile.state == ol.TileState.IDLE) {
        sourceTile.setLoader(this.loader_);
        sourceTile.load();
      }
      if (sourceTile.state == ol.TileState.LOADING) {
        var key = ol.events.listen(sourceTile, ol.events.EventType.CHANGE, function(e) {
          var state = sourceTile.getState();
          if (state == ol.TileState.LOADED ||
              state == ol.TileState.ERROR) {
            var uid = ol.getUid(sourceTile);
            if (state == ol.TileState.ERROR) {
              errorSourceTiles[uid] = true;
            } else {
              --leftToLoad;
              delete errorSourceTiles[uid];
            }
            if (leftToLoad - Object.keys(errorSourceTiles).length == 0) {
              this.finishLoading_();
            }
          }
        }.bind(this));
        this.loadListenerKeys_.push(key);
        ++leftToLoad;
      }
    }.bind(this));
  }
  if (leftToLoad - Object.keys(errorSourceTiles).length == 0) {
    setTimeout(this.finishLoading_.bind(this), 0);
  }
};


/**
 * @private
 */
ol.VectorImageTile.prototype.finishLoading_ = function() {
  var loaded = this.tileKeys.length;
  var empty = 0;
  for (var i = loaded - 1; i >= 0; --i) {
    var state = this.getTile(this.tileKeys[i]).getState();
    if (state != ol.TileState.LOADED) {
      --loaded;
    }
    if (state == ol.TileState.EMPTY) {
      ++empty;
    }
  }
  if (loaded == this.tileKeys.length) {
    this.loadListenerKeys_.forEach(ol.events.unlistenByKey);
    this.loadListenerKeys_.length = 0;
    this.setState(ol.TileState.LOADED);
  } else {
    this.setState(empty == this.tileKeys.length ? ol.TileState.EMPTY : ol.TileState.ERROR);
  }
};


/**
 * Sets the loader for a tile.
 * @param {ol.VectorTile} tile Vector tile.
 * @param {string} url URL.
 */
ol.VectorImageTile.defaultLoadFunction = function(tile, url) {
  var loader = ol.featureloader.loadFeaturesXhr(
      url, tile.getFormat(), tile.onLoad.bind(tile), tile.onError.bind(tile));

  tile.setLoader(loader);
};
