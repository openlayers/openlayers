/**
 * @module ol/VectorRenderTile
 */
import {getUid} from './util.js';
import Tile from './Tile.js';
import TileState from './TileState.js';
import {createCanvasContext2D} from './dom.js';


/**
 * @typedef {Object} ReplayState
 * @property {boolean} dirty
 * @property {null|import("./render.js").OrderFunction} renderedRenderOrder
 * @property {number} renderedTileRevision
 * @property {number} renderedResolution
 * @property {number} renderedRevision
 * @property {number} renderedZ
 * @property {number} renderedTileResolution
 * @property {number} renderedTileZ
 */


class VectorRenderTile extends Tile {

  /**
   * @param {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {TileState} state State.
   * @param {import("./tilecoord.js").TileCoord} urlTileCoord Wrapped tile coordinate for source urls.
   * @param {import("./tilegrid/TileGrid.js").default} sourceTileGrid Tile grid of the source.
   * @param {function(VectorRenderTile):Array<import("./VectorTile").default>} getSourceTiles Function
   * to get an source tiles for this tile.
   * @param {function(VectorRenderTile):void} removeSourceTiles Function to remove this tile from its
   * source tiles's consumer count.
   */
  constructor(tileCoord, state, urlTileCoord, sourceTileGrid, getSourceTiles, removeSourceTiles) {

    super(tileCoord, state, {transition: 0});

    /**
     * @private
     * @type {!Object<string, CanvasRenderingContext2D>}
     */
    this.context_ = {};

    /**
     * Executor groups by layer uid. Entries are read/written by the renderer.
     * @type {Object<string, Array<import("./render/canvas/ExecutorGroup.js").default>>}
     */
    this.executorGroups = {};

    /**
     * Number of loading source tiles. Read/written by the source.
     * @type {number}
     */
    this.loadingSourceTiles = 0;

    /**
     * Tile keys of error source tiles. Read/written by the source.
     * @type {Object<string, boolean>}
     */
    this.errorSourceTileKeys = {};

    /**
     * @private
     * @type {!Object<string, ReplayState>}
     */
    this.replayState_ = {};

    /**
     * @type {number}
     */
    this.wantedResolution;

    /**
     * @type {!function(import("./VectorRenderTile.js").default):Array<import("./VectorTile.js").default>}
     */
    this.getSourceTiles_ = getSourceTiles;

    /**
     * @type {!function(import("./VectorRenderTile.js").default):void}
     */
    this.removeSourceTiles_ = removeSourceTiles;

    /**
     * @private
     * @type {import("./tilegrid/TileGrid.js").default}
     */
    this.sourceTileGrid_ = sourceTileGrid;

    /**
     * z of the source tiles of the last getSourceTiles call.
     * @type {number}
     */
    this.sourceZ = -1;

    /**
     * True when all tiles for this tile's nominal resolution are available.
     * @type {boolean}
     */
    this.hifi = false;

    /**
     * @type {import("./tilecoord.js").TileCoord}
     */
    this.wrappedTileCoord = urlTileCoord;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.removeSourceTiles_(this);
    for (const key in this.context_) {
      const canvas = this.context_[key].canvas;
      canvas.width = canvas.height = 0;
    }
    for (const key in this.executorGroups) {
      const executorGroups = this.executorGroups[key];
      for (let i = 0, ii = executorGroups.length; i < ii; ++i) {
        executorGroups[i].disposeInternal();
      }
    }
    this.setState(TileState.ABORT);
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
   * @param {import("./layer/Layer.js").default} layer Layer.
   * @return {boolean} Tile has a rendering context for the given layer.
   */
  hasContext(layer) {
    return getUid(layer) in this.context_;
  }

  /**
   * Get the Canvas for this tile.
   * @param {import("./layer/Layer.js").default} layer Layer.
   * @return {HTMLCanvasElement} Canvas.
   */
  getImage(layer) {
    return this.hasContext(layer) ? this.getContext(layer).canvas : null;
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
        renderedZ: -1,
        renderedTileZ: -1
      };
    }
    return this.replayState_[key];
  }

  /**
   * @inheritDoc
   */
  load() {
    this.getSourceTiles_(this);
  }
}


export default VectorRenderTile;
