goog.provide('ol.VectorImageTile');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.array');
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
 */
ol.VectorImageTile = function(tileCoord, state, src, format, tileLoadFunction,
    urlTileCoord, tileUrlFunction, sourceTileGrid, tileGrid, sourceTiles,
    pixelRatio, projection, tileClass) {

  ol.Tile.call(this, tileCoord, state);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = null;

  /**
   * @private
   * @type {ol.format.Feature}
   */
  this.format_ = format;

  /**
   * @private
   * @type {ol.FeatureLoader}
   */
  this.loader_;

  /**
   * @private
   * @type {ol.TileReplayState}
   */
  this.replayState_ = {
    dirty: false,
    renderedRenderOrder: null,
    renderedRevision: -1,
    renderedTileRevision: -1
  };

  /**
   * @private
   * @type {Object.<string,ol.VectorTile>}
   */
  this.sourceTiles_ = sourceTiles;

  /**
   * @private
   * @type {Array.<string>}
   */
  this.usedSourceTileKeys_ = [];

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

  if (urlTileCoord) {
    var extent = tileGrid.getTileCoordExtent(urlTileCoord);
    var resolution = tileGrid.getResolution(tileCoord[0]);
    var sourceZ = sourceTileGrid.getZForResolution(resolution);
    sourceTileGrid.forEachTileCoord(extent, sourceZ, function(sourceTileCoord) {
      var sharedExtent = ol.extent.getIntersection(extent,
          sourceTileGrid.getTileCoordExtent(sourceTileCoord));
      if (ol.extent.getWidth(sharedExtent) / resolution >= 0.5 &&
          ol.extent.getHeight(sharedExtent) / resolution >= 0.5) {
        // only include source tile if overlap is at least 1 pixel
        var sourceTileKey = sourceTileCoord.toString();
        var sourceTile = sourceTiles[sourceTileKey];
        if (!sourceTile) {
          var tileUrl = /** @type {string} */
              (tileUrlFunction(sourceTileCoord, pixelRatio, projection));
          sourceTile = sourceTiles[sourceTileKey] = new tileClass(
              sourceTileCoord, ol.TileState.IDLE, tileUrl, format, tileLoadFunction);
        }
        sourceTile.consumers++;
        this.usedSourceTileKeys_.push(sourceTileKey);
      }
    }.bind(this));
  }

};
ol.inherits(ol.VectorImageTile, ol.Tile);


/**
 * @inheritDoc
 */
ol.VectorImageTile.prototype.disposeInternal = function() {
  var sourceTiles = this.getSourceTiles();
  for (var i = 0, ii = sourceTiles.length; i < ii; ++i) {
    var sourceTile = sourceTiles[i];
    sourceTile.consumers--;
    if (sourceTile.consumers == 0) {
      delete this.sourceTiles_[sourceTile.tileCoord.toString()];
      sourceTile.dispose();
    }
  }
  this.tileKeys.length = 0;
  this.sourceTiles_ = null;
  if (this.state == ol.TileState.LOADING) {
    this.loadListenerKeys_.forEach(ol.events.unlistenByKey);
    this.loadListenerKeys_.length = 0;
  }
  if (this.interimTile) {
    this.interimTile.dispose();
  }
  this.state = ol.TileState.ABORT;
  this.changed();
  ol.Tile.prototype.disposeInternal.call(this);
};


/**
 * @return {CanvasRenderingContext2D} The rendering context.
 */
ol.VectorImageTile.prototype.getContext = function() {
  if (!this.context_) {
    this.context_ = ol.dom.createCanvasContext2D();
  }
  return this.context_;
};


/**
 * Get the Canvas for this tile.
 * @return {HTMLCanvasElement} Canvas.
 * @api
 */
ol.VectorImageTile.prototype.getImage = function() {
  return this.replayState_.renderedTileRevision == -1 ?
      null : this.context_.canvas;
};


/**
 * Get the feature format assigned for reading this tile's features.
 * @return {ol.format.Feature} Feature format.
 * @api
 */
ol.VectorImageTile.prototype.getFormat = function() {
  return this.format_;
};


/**
 * @return {Array.<ol.Feature>} Features.
 */
ol.VectorImageTile.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * @return {ol.TileReplayState} The replay state.
 */
ol.VectorImageTile.prototype.getReplayState = function() {
  return this.replayState_;
};


/**
 * @inheritDoc
 */
ol.VectorImageTile.prototype.getKey = function() {
  return this.usedSourceTileKeys_.join('/') + '/' + this.src_;
};


/**
 * @return {Array.<ol.VectorTile>} Source tiles for this tile.
 */
ol.VectorImageTile.prototype.getSourceTiles = function() {
  return this.usedSourceTileKeys_.map(function(sourceTileKey) {
    return this.sourceTiles_[sourceTileKey];
  }.bind(this));
};


/**
 * @inheritDoc
 */
ol.VectorImageTile.prototype.load = function() {
  var leftToLoad = 0;
  if (this.state == ol.TileState.IDLE) {
    this.setState(ol.TileState.LOADING);
  }
  if (this.state == ol.TileState.LOADING) {
    this.usedSourceTileKeys_.forEach(function(sourceTileKey) {
      var sourceTile = this.sourceTiles_[sourceTileKey];
      if (sourceTile.state == ol.TileState.IDLE) {
        sourceTile.setLoader(this.loader_);
        sourceTile.load();
      }
      if (sourceTile.state == ol.TileState.LOADING) {
        var key = ol.events.listen(sourceTile, ol.events.EventType.CHANGE, function(e) {
          var state = sourceTile.getState();
          if (state == ol.TileState.LOADED ||
              state == ol.TileState.ERROR ||
              state == ol.TileState.EMPTY) {
            --leftToLoad;
            ol.events.unlistenByKey(key);
            ol.array.remove(this.loadListenerKeys_, key);
            if (leftToLoad == 0) {
              this.setState(ol.TileState.LOADED);
            }
          }
        }.bind(this));
        this.loadListenerKeys_.push(key);
        ++leftToLoad;
      }
    }.bind(this));
  }
  if (leftToLoad == 0) {
    setTimeout(function() {
      this.setState(ol.TileState.LOADED);
    }.bind(this), 0);
  }
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @api
 */
ol.VectorImageTile.prototype.setFeatures = function(features) {
  this.features_ = features;
  this.setState(ol.TileState.LOADED);
};


/**
 * @param {ol.TileState} tileState Tile state.
 */
ol.VectorImageTile.prototype.setState = function(tileState) {
  this.state = tileState;
  this.changed();
};


/**
 * Sets the loader for a tile.
 * @param {ol.VectorTile} tile Vector tile.
 * @param {string} url URL.
 */
ol.VectorImageTile.defaultLoadFunction = function(tile, url) {
  var loader = ol.featureloader.loadFeaturesXhr(
      url, tile.getFormat(), tile.onLoad_.bind(tile), tile.onError_.bind(tile));

  tile.setLoader(loader);
};
