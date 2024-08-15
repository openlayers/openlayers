/**
 * @module ol/source/CompositeTile
 */

import DataTile from '../DataTile.js';
import DataTileSource from '../source/DataTile.js';
import EventType from '../events/EventType.js';
import ReprojDataTile from '../reproj/DataTile.js';
import TileState from '../TileState.js';
import {listen, unlistenByKey} from '../events.js';

/**
 * @typedef {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement|ImageBitmap} ImageLike
 */

/**
 * @typedef {Uint8Array|Uint8ClampedArray|Float32Array|DataView} ArrayLike
 */

/**
 * Data that can be used with a DataTile.
 * @typedef {ArrayLike|ImageLike} Data
 */

/**
 * @typedef {import("./DataTile.js").default} SourceType
 */

/**
 * @typedef {Object} Options
 * @property {number} [transition] Transition time when fading in new tiles (in milliseconds).
 * @property {string} [key] Key for use in caching tiles.
 * @property {Array<SourceType>} sources sources.
 */

/**
 * @classdesc
 * A composite tile source
 * @api
 */
class CompositeTileSource extends DataTileSource {
  /**
   * @param {Options} options Source options.
   */
  constructor(options) {
    const sources = options.sources || [];

    const wrapX = sources.every((source) => source.getWrapX());
    const attributions = (
      /** @type {import('../Map.js').FrameState} */ frameState,
    ) =>
      sources
        .map((source) => source.getAttributions())
        .filter(Boolean)
        .map((func) => func(frameState))
        .join(' / ');
    const attributionsCollapsible = sources.every((source) =>
      source.getAttributionsCollapsible(),
    );
    const bandCount = sources.reduce(
      (acc, source) => acc + (source.bandCount || 4),
      0,
    );

    super({
      attributions,
      attributionsCollapsible,
      projection: null,
      tileGrid: null,
      wrapX,
      transition: options.transition,
      interpolate: false,
      key: options.key,
      bandCount,
    });

    /**
     * @private
     * @type {Array<SourceType>}
     */
    this.sources_ = sources;

    // Reorganizes projection and tileGrid mappings.
    const projections = [];
    sources.forEach((source) => {
      const tileGrid = source.getTileGrid();
      const projection = source.getProjection();

      if (tileGrid && projection) {
        this.setTileGridForProjection(projection, tileGrid);
        projections.push(projection);
      }
    });
    projections.forEach((projection) => {
      const tileGrid = this.getTileGridForProjection(projection);
      sources.forEach((source) => {
        source.setTileGridForProjection(projection, tileGrid);
      });
    });
  }

  /**
   * @override
   */
  getBandCounts() {
    return this.sources_.map((source) => source.bandCount || 4);
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {DataTile} Tile (or null if outside source extent).
   * @override
   */
  getTile(z, x, y, pixelRatio, projection) {
    const size = this.getTileSize(z);
    const controller = new AbortController();

    let compositeTile = undefined;
    const loader = () =>
      /** @type {Promise<Array<Data>>} */ new Promise((resolve) => {
        const tiles = [];
        const loadEnd = () => {
          const x = tiles.map((tile) =>
            tile instanceof DataTile || tile instanceof ReprojDataTile
              ? tile.getData()
              : tile.getImage(),
          );
          resolve(x);
        };
        let leftToLoad = 0;
        const listenKeys = [];
        for (let slot = 0; slot < this.sources_.length; slot++) {
          const src = this.sources_[slot];
          const tile = src.getTile(z, x, y, pixelRatio, projection);
          if (!tile) {
            continue;
          }
          tiles.push(tile);

          const state = tile.getState();
          if (state == TileState.IDLE || state == TileState.LOADING) {
            leftToLoad++;

            const listenKey = listen(tile, EventType.CHANGE, () => {
              const state = tile.getState();
              if (
                state == TileState.LOADED ||
                state == TileState.ERROR ||
                state == TileState.EMPTY
              ) {
                unlistenByKey(listenKey);

                leftToLoad--;
                if (leftToLoad === 0) {
                  for (const key of listenKeys) {
                    unlistenByKey(key);
                  }
                  loadEnd();
                }
              }
            });
            listenKeys.push(listenKey);
          }
        }

        if (leftToLoad === 0) {
          setTimeout(loadEnd, 0);
        } else {
          tiles.forEach((tile) => {
            if (tile.getState() == TileState.IDLE) {
              tile.load();
            }
          });
        }
      });

    compositeTile = new DataTile({
      tileCoord: [z, x, y],
      loader: loader,
      size: size,
      controller: controller,
      ...this.tileOptions,
    });
    compositeTile.key = this.getKey();

    return compositeTile;
  }
}

export default CompositeTileSource;
