/**
 * @module ol/VectorRenderTile
 */
import Tile from './Tile.js';
import {createCanvasContext2D, releaseCanvas} from './dom.js';
import {getUid} from './util.js';

/**
 * @typedef {Object} ReplayState
 * @property {boolean} dirty Dirty.
 * @property {null|import("./render.js").OrderFunction} renderedRenderOrder RenderedRenderOrder.
 * @property {number} renderedTileRevision RenderedTileRevision.
 * @property {number} renderedResolution RenderedResolution.
 * @property {number} renderedRevision RenderedRevision.
 * @property {number} renderedTileResolution RenderedTileResolution.
 * @property {number} renderedTileZ RenderedTileZ.
 */

/**
 * @type {Array<HTMLCanvasElement>}
 */
const canvasPool = [];

class VectorRenderTile extends Tile {
  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("./TileState.js").default} state State.
   * @param {import("./tilecoord.js").TileCoord} urlTileCoord Wrapped tile coordinate for source urls.
   * @param {function(VectorRenderTile):Array<import("./VectorTile").default>} getSourceTiles Function.
   * @param {function(VectorRenderTile):void} removeSourceTiles Function.
   */
  constructor(
    tileCoord,
    state,
    urlTileCoord,
    getSourceTiles,
    removeSourceTiles,
  ) {
    super(tileCoord, state, {transition: 0});

    /**
     * @private
     * @type {CanvasRenderingContext2D|null}
     */
    this.context_ = null;

    /**
     * Executor groups. Read/written by the renderer.
     * @type {Object<string, Array<import("./render/canvas/ExecutorGroup.js").default>>}
     */
    this.executorGroups = {};

    /**
     * Number of loading source tiles. Read/written by the source.
     * @type {number}
     */
    this.loadingSourceTiles = 0;

    /**
     * @type {Object<string, ImageData>}
     */
    this.hitDetectionImageData = {};

    /**
     * @private
     * @type {!Object<string, ReplayState>}
     */
    this.replayState_ = {};

    /**
     * @type {Array<import("./VectorTile.js").default>}
     */
    this.sourceTiles = [];

    /**
     * @type {Object<string, boolean>}
     */
    this.errorTileKeys = {};

    /**
     * @type {number}
     */
    this.wantedResolution;

    /**
     * @type {!function():Array<import("./VectorTile.js").default>}
     */
    this.getSourceTiles = getSourceTiles.bind(undefined, this);

    /**
     * @type {!function(VectorRenderTile):void}
     * @private
     */
    this.removeSourceTiles_ = removeSourceTiles;

    /**
     * @type {import("./tilecoord.js").TileCoord}
     */
    this.wrappedTileCoord = urlTileCoord;
  }

  /**
   * @return {CanvasRenderingContext2D} The rendering context.
   */
  getContext() {
    if (!this.context_) {
      this.context_ = createCanvasContext2D(1, 1, canvasPool);
    }
    return this.context_;
  }

  /**
   * @return {boolean} Tile has a rendering context.
   */
  hasContext() {
    return !!this.context_;
  }

  /**
   * Get the Canvas for this tile.
   * @return {HTMLCanvasElement} Canvas.
   */
  getImage() {
    return this.hasContext() ? this.getContext().canvas : null;
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
        renderedResolution: NaN,
        renderedRevision: -1,
        renderedTileResolution: NaN,
        renderedTileRevision: -1,
        renderedTileZ: -1,
      };
    }
    return this.replayState_[key];
  }

  /**
   * Load the tile.
   * @override
   */
  load() {
    this.getSourceTiles();
  }

  /**
   * Remove from the cache due to expiry
   * @override
   */
  release() {
    if (this.context_) {
      releaseCanvas(this.context_);
      canvasPool.push(this.context_.canvas);
      this.context_ = null;
    }
    this.removeSourceTiles_(this);
    this.sourceTiles.length = 0;
    super.release();
  }
}

export default VectorRenderTile;
