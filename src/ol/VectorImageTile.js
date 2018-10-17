/**
 * @module ol/VectorImageTile
 */
import {getUid} from './util.js';
import Tile from './Tile.js';
import TileState from './TileState.js';
import {createCanvasContext2D} from './dom.js';
import {listen, unlistenByKey} from './events.js';
import {getHeight, getIntersection, getWidth} from './extent.js';
import EventType from './events/EventType.js';
import {loadFeaturesXhr} from './featureloader.js';
import {VOID} from './functions.js';


/**
 * @typedef {Object} ReplayState
 * @property {boolean} dirty
 * @property {null|import("./render.js").OrderFunction} renderedRenderOrder
 * @property {number} renderedTileRevision
 * @property {number} renderedRevision
 */


class VectorImageTile extends Tile {

  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {TileState} state State.
   * @param {number} sourceRevision Source revision.
   * @param {import("./format/Feature.js").default} format Feature format.
   * @param {import("./Tile.js").LoadFunction} tileLoadFunction Tile load function.
   * @param {import("./tilecoord.js").TileCoord} urlTileCoord Wrapped tile coordinate for source urls.
   * @param {import("./Tile.js").UrlFunction} tileUrlFunction Tile url function.
   * @param {import("./tilegrid/TileGrid.js").default} sourceTileGrid Tile grid of the source.
   * @param {import("./tilegrid/TileGrid.js").default} tileGrid Tile grid of the renderer.
   * @param {Object<string, import("./VectorTile.js").default>} sourceTiles Source tiles.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("./proj/Projection.js").default} projection Projection.
   * @param {typeof import("./VectorTile.js").default} tileClass Class to
   *     instantiate for source tiles.
   * @param {function(this: import("./source/VectorTile.js").default, import("./events/Event.js").default)} handleTileChange
   *     Function to call when a source tile's state changes.
   * @param {number} zoom Integer zoom to render the tile for.
   */
  constructor(tileCoord, state, sourceRevision, format, tileLoadFunction,
    urlTileCoord, tileUrlFunction, sourceTileGrid, tileGrid, sourceTiles,
    pixelRatio, projection, tileClass, handleTileChange, zoom) {

    super(tileCoord, state, {transition: 0});

    /**
     * @private
     * @type {!Object<string, CanvasRenderingContext2D>}
     */
    this.context_ = {};

    /**
     * @private
     * @type {import("./featureloader.js").FeatureLoader}
     */
    this.loader_;

    /**
     * @private
     * @type {!Object<string, ReplayState>}
     */
    this.replayState_ = {};

    /**
     * @private
     * @type {Object<string, import("./VectorTile.js").default>}
     */
    this.sourceTiles_ = sourceTiles;

    /**
     * Keys of source tiles used by this tile. Use with {@link #getTile}.
     * @type {Array<string>}
     */
    this.tileKeys = [];

    /**
     * @type {import("./extent.js").Extent}
     */
    this.extent = null;

    /**
     * @type {number}
     */
    this.sourceRevision_ = sourceRevision;

    /**
     * @type {import("./tilecoord.js").TileCoord}
     */
    this.wrappedTileCoord = urlTileCoord;

    /**
     * @type {Array<import("./events.js").EventsKey>}
     */
    this.loadListenerKeys_ = [];

    /**
     * @type {Array<import("./events.js").EventsKey>}
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
            tileClass, VOID, --zoom);
          if (tile.state == TileState.LOADED) {
            this.interimTile = tile;
            break;
          }
        }
      }
    }

  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
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
    super.disposeInternal();
  }

  /**
   * @param {import("./layer/Layer.js").default} layer Layer.
   * @return {CanvasRenderingContext2D} The rendering context.
   */
  getContext(layer) {
    const key = getUid(layer);
    if (!(key in this.context_)) {
      this.context_[key] = createCanvasContext2D();
    }
    return this.context_[key];
  }

  /**
   * Get the Canvas for this tile.
   * @param {import("./layer/Layer.js").default} layer Layer.
   * @return {HTMLCanvasElement} Canvas.
   */
  getImage(layer) {
    return this.getReplayState(layer).renderedTileRevision == -1 ?
      null : this.getContext(layer).canvas;
  }

  /**
   * @param {import("./layer/Layer.js").default} layer Layer.
   * @return {ReplayState} The replay state.
   */
  getReplayState(layer) {
    const key = getUid(layer);
    if (!(key in this.replayState_)) {
      this.replayState_[key] = {
        dirty: false,
        renderedRenderOrder: null,
        renderedRevision: -1,
        renderedTileRevision: -1
      };
    }
    return this.replayState_[key];
  }

  /**
   * @inheritDoc
   */
  getKey() {
    return this.tileKeys.join('/') + '-' + this.sourceRevision_;
  }

  /**
   * @param {string} tileKey Key (tileCoord) of the source tile.
   * @return {import("./VectorTile.js").default} Source tile.
   */
  getTile(tileKey) {
    return this.sourceTiles_[tileKey];
  }

  /**
   * @inheritDoc
   */
  load() {
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
  }

  /**
   * @private
   */
  finishLoading_() {
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
  }
}


export default VectorImageTile;

/**
 * Sets the loader for a tile.
 * @param {import("./VectorTile.js").default} tile Vector tile.
 * @param {string} url URL.
 */
export function defaultLoadFunction(tile, url) {
  const loader = loadFeaturesXhr(url, tile.getFormat(), tile.onLoad.bind(tile), tile.onError.bind(tile));
  tile.setLoader(loader);
}
