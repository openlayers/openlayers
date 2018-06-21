/**
 * @module ol/VectorImageTile
 */
import {getUid, inherits} from './util.js';
import Tile from './Tile.js';
import TileState from './TileState.js';
import {createCanvasContext2D} from './dom.js';
import {listen, unlistenByKey} from './events.js';
import {getHeight, getIntersection, getWidth} from './extent.js';
import EventType from './events/EventType.js';
import {loadFeaturesXhr} from './featureloader.js';
import {UNDEFINED} from './functions.js';


/**
 * @typedef {Object} ReplayState
 * @property {boolean} dirty
 * @property {null|module:ol/render~OrderFunction} renderedRenderOrder
 * @property {number} renderedTileRevision
 * @property {number} renderedRevision
 */


/**
 * @constructor
 * @extends {module:ol/Tile}
 * @param {module:ol/tilecoord~TileCoord} tileCoord Tile coordinate.
 * @param {module:ol/TileState} state State.
 * @param {number} sourceRevision Source revision.
 * @param {module:ol/format/Feature} format Feature format.
 * @param {module:ol/Tile~LoadFunction} tileLoadFunction Tile load function.
 * @param {module:ol/tilecoord~TileCoord} urlTileCoord Wrapped tile coordinate for source urls.
 * @param {module:ol/Tile~UrlFunction} tileUrlFunction Tile url function.
 * @param {module:ol/tilegrid/TileGrid} sourceTileGrid Tile grid of the source.
 * @param {module:ol/tilegrid/TileGrid} tileGrid Tile grid of the renderer.
 * @param {Object.<string, module:ol/VectorTile>} sourceTiles Source tiles.
 * @param {number} pixelRatio Pixel ratio.
 * @param {module:ol/proj/Projection} projection Projection.
 * @param {function(new: module:ol/VectorTile, module:ol/tilecoord~TileCoord, module:ol/TileState, string,
 *     module:ol/format/Feature, module:ol/Tile~LoadFunction)} tileClass Class to
 *     instantiate for source tiles.
 * @param {function(this: module:ol/source/VectorTile, module:ol/events/Event)} handleTileChange
 *     Function to call when a source tile's state changes.
 * @param {number} zoom Integer zoom to render the tile for.
 */
const VectorImageTile = function(tileCoord, state, sourceRevision, format,
  tileLoadFunction, urlTileCoord, tileUrlFunction, sourceTileGrid, tileGrid,
  sourceTiles, pixelRatio, projection, tileClass, handleTileChange, zoom) {

  Tile.call(this, tileCoord, state, {transition: 0});

  /**
   * @private
   * @type {!Object.<string, CanvasRenderingContext2D>}
   */
  this.context_ = {};

  /**
   * @private
   * @type {module:ol/featureloader~FeatureLoader}
   */
  this.loader_;

  /**
   * @private
   * @type {!Object.<string, module:ol/VectorImageTile~ReplayState>}
   */
  this.replayState_ = {};

  /**
   * @private
   * @type {Object.<string, module:ol/VectorTile>}
   */
  this.sourceTiles_ = sourceTiles;

  /**
   * Keys of source tiles used by this tile. Use with {@link #getTile}.
   * @type {Array.<string>}
   */
  this.tileKeys = [];

  /**
   * @type {module:ol/extent~Extent}
   */
  this.extent = null;

  /**
   * @type {number}
   */
  this.sourceRevision_ = sourceRevision;

  /**
   * @type {module:ol/tilecoord~TileCoord}
   */
  this.wrappedTileCoord = urlTileCoord;

  /**
   * @type {Array.<module:ol/events~EventsKey>}
   */
  this.loadListenerKeys_ = [];

  /**
   * @type {Array.<module:ol/events~EventsKey>}
   */
  this.sourceTileListenerKeys_ = [];

  if (urlTileCoord) {
    const extent = this.extent = tileGrid.getTileCoordExtent(urlTileCoord);
    const resolution = tileGrid.getResolution(zoom);
    const sourceZ = sourceTileGrid.getZForResolution(resolution);
    const useLoadedOnly = zoom != tileCoord[0];
    let loadCount = 0;
    sourceTileGrid.forEachTileCoord(extent, sourceZ, function(sourceTileCoord) {
      let sharedExtent = getIntersection(extent,
        sourceTileGrid.getTileCoordExtent(sourceTileCoord));
      const sourceExtent = sourceTileGrid.getExtent();
      if (sourceExtent) {
        sharedExtent = getIntersection(sharedExtent, sourceExtent, sharedExtent);
      }
      if (getWidth(sharedExtent) / resolution >= 0.5 &&
          getHeight(sharedExtent) / resolution >= 0.5) {
        // only include source tile if overlap is at least 1 pixel
        ++loadCount;
        const sourceTileKey = sourceTileCoord.toString();
        let sourceTile = sourceTiles[sourceTileKey];
        if (!sourceTile && !useLoadedOnly) {
          const tileUrl = tileUrlFunction(sourceTileCoord, pixelRatio, projection);
          sourceTile = sourceTiles[sourceTileKey] = new tileClass(sourceTileCoord,
            tileUrl == undefined ? TileState.EMPTY : TileState.IDLE,
            tileUrl == undefined ? '' : tileUrl,
            format, tileLoadFunction);
          this.sourceTileListenerKeys_.push(
            listen(sourceTile, EventType.CHANGE, handleTileChange));
        }
        if (sourceTile && (!useLoadedOnly || sourceTile.getState() == TileState.LOADED)) {
          sourceTile.consumers++;
          this.tileKeys.push(sourceTileKey);
        }
      }
    }.bind(this));

    if (useLoadedOnly && loadCount == this.tileKeys.length) {
      this.finishLoading_();
    }

    if (zoom <= tileCoord[0] && this.state != TileState.LOADED) {
      while (zoom > tileGrid.getMinZoom()) {
        const tile = new VectorImageTile(tileCoord, state, sourceRevision,
          format, tileLoadFunction, urlTileCoord, tileUrlFunction,
          sourceTileGrid, tileGrid, sourceTiles, pixelRatio, projection,
          tileClass, UNDEFINED, --zoom);
        if (tile.state == TileState.LOADED) {
          this.interimTile = tile;
          break;
        }
      }
    }
  }

};

inherits(VectorImageTile, Tile);


/**
 * @inheritDoc
 */
VectorImageTile.prototype.disposeInternal = function() {
  this.state = TileState.ABORT;
  this.changed();
  if (this.interimTile) {
    this.interimTile.dispose();
  }

  for (let i = 0, ii = this.tileKeys.length; i < ii; ++i) {
    const sourceTileKey = this.tileKeys[i];
    const sourceTile = this.getTile(sourceTileKey);
    sourceTile.consumers--;
    if (sourceTile.consumers == 0) {
      delete this.sourceTiles_[sourceTileKey];
      sourceTile.dispose();
    }
  }
  this.tileKeys.length = 0;
  this.sourceTiles_ = null;
  this.loadListenerKeys_.forEach(unlistenByKey);
  this.loadListenerKeys_.length = 0;
  this.sourceTileListenerKeys_.forEach(unlistenByKey);
  this.sourceTileListenerKeys_.length = 0;
  Tile.prototype.disposeInternal.call(this);
};


/**
 * @param {module:ol/layer/Layer} layer Layer.
 * @return {CanvasRenderingContext2D} The rendering context.
 */
VectorImageTile.prototype.getContext = function(layer) {
  const key = getUid(layer).toString();
  if (!(key in this.context_)) {
    this.context_[key] = createCanvasContext2D();
  }
  return this.context_[key];
};


/**
 * Get the Canvas for this tile.
 * @param {module:ol/layer/Layer} layer Layer.
 * @return {HTMLCanvasElement} Canvas.
 */
VectorImageTile.prototype.getImage = function(layer) {
  return this.getReplayState(layer).renderedTileRevision == -1 ?
    null : this.getContext(layer).canvas;
};


/**
 * @param {module:ol/layer/Layer} layer Layer.
 * @return {module:ol/VectorImageTile~ReplayState} The replay state.
 */
VectorImageTile.prototype.getReplayState = function(layer) {
  const key = getUid(layer).toString();
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
VectorImageTile.prototype.getKey = function() {
  return this.tileKeys.join('/') + '-' + this.sourceRevision_;
};


/**
 * @param {string} tileKey Key (tileCoord) of the source tile.
 * @return {module:ol/VectorTile} Source tile.
 */
VectorImageTile.prototype.getTile = function(tileKey) {
  return this.sourceTiles_[tileKey];
};


/**
 * @inheritDoc
 */
VectorImageTile.prototype.load = function() {
  // Source tiles with LOADED state - we just count them because once they are
  // loaded, we're no longer listening to state changes.
  let leftToLoad = 0;
  // Source tiles with ERROR state - we track them because they can still have
  // an ERROR state after another load attempt.
  const errorSourceTiles = {};

  if (this.state == TileState.IDLE) {
    this.setState(TileState.LOADING);
  }
  if (this.state == TileState.LOADING) {
    this.tileKeys.forEach(function(sourceTileKey) {
      const sourceTile = this.getTile(sourceTileKey);
      if (sourceTile.state == TileState.IDLE) {
        sourceTile.setLoader(this.loader_);
        sourceTile.load();
      }
      if (sourceTile.state == TileState.LOADING) {
        const key = listen(sourceTile, EventType.CHANGE, function(e) {
          const state = sourceTile.getState();
          if (state == TileState.LOADED ||
              state == TileState.ERROR) {
            const uid = getUid(sourceTile);
            if (state == TileState.ERROR) {
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
VectorImageTile.prototype.finishLoading_ = function() {
  let loaded = this.tileKeys.length;
  let empty = 0;
  for (let i = loaded - 1; i >= 0; --i) {
    const state = this.getTile(this.tileKeys[i]).getState();
    if (state != TileState.LOADED) {
      --loaded;
    }
    if (state == TileState.EMPTY) {
      ++empty;
    }
  }
  if (loaded == this.tileKeys.length) {
    this.loadListenerKeys_.forEach(unlistenByKey);
    this.loadListenerKeys_.length = 0;
    this.setState(TileState.LOADED);
  } else {
    this.setState(empty == this.tileKeys.length ? TileState.EMPTY : TileState.ERROR);
  }
};

export default VectorImageTile;

/**
 * Sets the loader for a tile.
 * @param {module:ol/VectorTile} tile Vector tile.
 * @param {string} url URL.
 */
export function defaultLoadFunction(tile, url) {
  const loader = loadFeaturesXhr(url, tile.getFormat(), tile.onLoad.bind(tile), tile.onError.bind(tile));
  tile.setLoader(loader);
}
