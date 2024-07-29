/**
 * @module ol/CompositeTile
 */
import EventType from './events/EventType.js';
import Tile from './Tile.js';
import TileState from './TileState.js';
import {listen, unlistenByKey} from './events.js';

/**
 * @typedef {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} ImageLike
 */

/**
 * @typedef {Uint8Array|Uint8ClampedArray|Float32Array|DataView} ArrayLike
 */

/**
 * Data that can be used with a CompositeTile.
 * @typedef {ArrayLike|ImageLike} Data
 */

/**
 * This is set as the cancellation reason when a tile is disposed.
 */
export const disposedError = new Error('disposed');

/**
 * @template {Tile} [TileType=Tile]
 * @typedef {Object} TileContainer
 * @property {TileType} tile Tile.
 */
/**
 * @template {Tile} [TileType=Tile]
 * @template {TileContainer<TileType>} [TileContainerType=any]
 * @typedef {Object} Options
 * @property {import("./tilecoord.js").TileCoord} tileCoord Tile coordinate.
 * @property {number} [transition=250] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @property {import('./size.js').Size} [size=[256, 256]] Tile size.
 * @property {AbortController} [controller] An abort controller.
 * @property {Array<TileContainerType>} [sourceTiles] Underlying source tiles.
 * @property {string} [key] Key.
 * @api
 */

/**
 * @template {Tile} [TileType=any]
 * @template {TileContainer<TileType>} [TileContainerType=any]
 * @classdesc
 */
class CompositeTile extends Tile {
  /**
   * @param {Options<TileType, TileContainerType>} options Tile options.
   */
  constructor(options) {
    const state = TileState.IDLE;

    super(options.tileCoord, state, {
      transition: options.transition,
      interpolate: options.interpolate,
    });

    /**
     * @type {Array<TileContainerType>}
     * @protected
     */
    this.sourceTiles = options.sourceTiles || [];

    /**
     * @private
     * @type {?Array<import("./events.js").EventsKey>}
     */
    this.sourcesListenerKeys_ = null;

    /**
     * @type {import('./size.js').Size|null}
     * @private
     */
    this.size_ = options.size || null;

    /**
     * @type {AbortController|null}
     * @private
     */
    this.controller_ = options.controller || null;

    this.key = options.key || '';
  }

  /**
   * Load the tile data.
   * @api
   * @override
   */
  load() {
    if (this.state == TileState.IDLE) {
      this.state = TileState.LOADING;
      this.changed();

      let leftToLoad = 0;

      this.sourcesListenerKeys_ = [];
      this.sourceTiles.forEach(({tile}) => {
        const state = tile.getState();
        if (state == TileState.IDLE || state == TileState.LOADING) {
          leftToLoad++;

          const sourceListenKey = listen(tile, EventType.CHANGE, () => {
            const state = tile.getState();
            if (
              state == TileState.LOADED ||
              state == TileState.ERROR ||
              state == TileState.EMPTY
            ) {
              unlistenByKey(sourceListenKey);
              leftToLoad--;
              if (leftToLoad === 0) {
                this.unlistenSources_();
                this.loadEnd();
              }
            }
          });
          this.sourcesListenerKeys_.push(sourceListenKey);
        }
      });

      if (leftToLoad === 0) {
        setTimeout(this.loadEnd.bind(this), 0);
      } else {
        this.sourceTiles.forEach(function ({tile}) {
          const state = tile.getState();
          if (state == TileState.IDLE) {
            tile.load();
          }
        });
      }
    }
  }

  getTiles() {
    return this.sourceTiles.map(({tile}) => tile);
  }

  loadEnd() {
    this.state = this.sourceTiles
      .map(({tile}) => tile.getState())
      .some((x) => x === TileState.ERROR)
      ? TileState.ERROR
      : TileState.LOADED;
    this.changed();
  }

  /**
   * @private
   */
  unlistenSources_() {
    this.sourcesListenerKeys_.forEach(unlistenByKey);
    this.sourcesListenerKeys_ = null;
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    if (this.controller_) {
      this.controller_.abort(disposedError);
      this.controller_ = null;
    }
    super.disposeInternal();
  }
}

export default CompositeTile;
