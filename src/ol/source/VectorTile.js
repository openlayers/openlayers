/**
 * @module ol/source/VectorTile
 */

import TileState from '../TileState.js';
import VectorRenderTile from '../VectorRenderTile.js';
import Tile from '../VectorTile.js';
import {toSize} from '../size.js';
import UrlTile from './UrlTile.js';
import {getKeyZXY, getKey} from '../tilecoord.js';
import {createXYZ, extentFromProjection, createForProjection} from '../tilegrid.js';
import {buffer as bufferExtent, getIntersection} from '../extent.js';
import {listen, unlistenByKey} from '../events.js';
import EventType from '../events/EventType.js';
import {loadFeaturesXhr} from '../featureloader.js';
import {isEmpty} from '../obj.js';
import {equals} from '../array.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize=128] Cache size.
 * @property {import("../extent.js").Extent} [extent]
 * @property {import("../format/Feature.js").default} [format] Feature format for tiles. Used and required by the default.
 * @property {boolean} [overlaps=true] This source may have overlapping geometries. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Projection of the tile grid.
 * @property {import("./State.js").default} [state] Source state.
 * @property {typeof import("../VectorTile.js").default} [tileClass] Class used to instantiate image tiles.
 * Default is {@link module:ol/VectorTile}.
 * @property {number} [maxZoom=22] Optional max zoom level.
 * @property {number} [minZoom] Optional min zoom level.
 * @property {number|import("../size.js").Size} [tileSize=512] Optional tile size.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction]
 * Optional function to load a tile given a URL. Could look like this for pbf tiles:
 * ```js
 * function(tile, url) {
 *   tile.setLoader(function(extent, resolution, projection) {
 *     fetch(url).then(function(response) {
 *       response.arrayBuffer().then(function(data) {
 *         const format = tile.getFormat() // ol/format/MVT configured as source format
 *         const features = format.readFeatures(data, {
 *           extent: extent,
 *           featureProjection: projection
 *         });
 *         tile.setFeatures(features);
 *       });
 *     });
 *   });
 * }
 * ```
 * @property {import("../Tile.js").UrlFunction} [tileUrlFunction] Optional function to get tile URL given a tile coordinate and the projection.
 * @property {string} [url] URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @property {number} [transition] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 * @property {Array<string>} [urls] An array of URL templates.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * When set to `false`, only one world
 * will be rendered. When set to `true`, tiles will be wrapped horizontally to
 * render multiple worlds.
 */


/**
 * @classdesc
 * Class for layer sources providing vector data divided into a tile grid, to be
 * used with {@link module:ol/layer/VectorTile~VectorTile}. Although this source receives tiles
 * with vector features from the server, it is not meant for feature editing.
 * Features are optimized for rendering, their geometries are clipped at or near
 * tile boundaries and simplified for a view resolution. See
 * {@link module:ol/source/Vector} for vector sources that are suitable for feature
 * editing.
 *
 * @fires import("./Tile.js").TileSourceEvent
 * @api
 */
class VectorTile extends UrlTile {
  /**
   * @param {!Options} options Vector tile options.
   */
  constructor(options) {
    const projection = options.projection || 'EPSG:3857';

    const extent = options.extent || extentFromProjection(projection);

    const tileGrid = options.tileGrid || createXYZ({
      extent: extent,
      maxZoom: options.maxZoom || 22,
      minZoom: options.minZoom,
      tileSize: options.tileSize || 512
    });

    super({
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      cacheSize: options.cacheSize,
      opaque: false,
      projection: projection,
      state: options.state,
      tileGrid: tileGrid,
      tileLoadFunction: options.tileLoadFunction ? options.tileLoadFunction : defaultLoadFunction,
      tileUrlFunction: options.tileUrlFunction,
      url: options.url,
      urls: options.urls,
      wrapX: options.wrapX === undefined ? true : options.wrapX,
      transition: options.transition
    });

    /**
     * @private
     * @type {import("../format/Feature.js").default}
     */
    this.format_ = options.format ? options.format : null;

    /**
     * @type {Object<string, import("./VectorTile").default>}
     */
    this.loadingTiles_ = {};

    /**
     * @private
     * @type {Object<string, import("../VectorTile.js").default>}
     */
    this.sourceTiles_ = {};

    /**
     * @private
     * @type {Object<string, Array<import("../VectorTile.js").default>>}
     */
    this.sourceTilesByTileKey_ = {};

    /**
     * @private
     * @type {boolean}
     */
    this.overlaps_ = options.overlaps == undefined ? true : options.overlaps;

    /**
     * @protected
     * @type {typeof import("../VectorTile.js").default}
     */
    this.tileClass = options.tileClass ? options.tileClass : Tile;

    /**
     * @private
     * @type {Object<string, import("../tilegrid/TileGrid.js").default>}
     */
    this.tileGrids_ = {};

  }

  /**
   * @return {boolean} The source can have overlapping geometries.
   */
  getOverlaps() {
    return this.overlaps_;
  }

  /**
   * clear {@link module:ol/TileCache~TileCache} and delete all source tiles
   * @api
   */
  clear() {
    this.tileCache.clear();
    this.sourceTiles_ = {};
    this.sourceTilesByTileKey_ = {};
  }

  /**
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection").default} projection Projection.
   * @param {VectorRenderTile} tile Vector image tile.
   * @return {Array<import("../VectorTile").default>} Tile keys.
   */
  getSourceTiles(pixelRatio, projection, tile) {
    const sourceTiles = [];
    const urlTileCoord = tile.wrappedTileCoord;
    if (urlTileCoord) {
      const tileGrid = this.getTileGridForProjection(projection);
      const extent = tileGrid.getTileCoordExtent(urlTileCoord);
      const z = urlTileCoord[0];
      const resolution = tileGrid.getResolution(z);
      // make extent 1 pixel smaller so we don't load tiles for < 0.5 pixel render space
      bufferExtent(extent, -1 / resolution, extent);
      const sourceTileGrid = this.tileGrid;
      const sourceExtent = sourceTileGrid.getExtent();
      if (sourceExtent) {
        getIntersection(extent, sourceExtent, extent);
      }
      const sourceZ = sourceTileGrid.getZForResolution(resolution, 1);
      const minZoom = sourceTileGrid.getMinZoom();

      let loadedZ = sourceZ + 1;
      let covered, empty;
      do {
        --loadedZ;
        covered = true;
        empty = true;
        sourceTileGrid.forEachTileCoord(extent, loadedZ, function(sourceTileCoord) {
          const tileKey = getKey(sourceTileCoord);
          let sourceTile;
          if (tileKey in this.sourceTiles_) {
            sourceTile = this.sourceTiles_[tileKey];
            const state = sourceTile.getState();
            if (state === TileState.LOADED || state === TileState.ERROR || state === TileState.EMPTY) {
              empty = empty && state === TileState.EMPTY;
              sourceTiles.push(sourceTile);
              return;
            }
          } else if (loadedZ === sourceZ) {
            const tileUrl = this.tileUrlFunction(sourceTileCoord, pixelRatio, projection);
            sourceTile = new this.tileClass(sourceTileCoord,
              tileUrl == undefined ? TileState.EMPTY : TileState.IDLE,
              tileUrl == undefined ? '' : tileUrl,
              this.format_, this.tileLoadFunction);
            sourceTile.extent = sourceTileGrid.getTileCoordExtent(sourceTileCoord);
            sourceTile.projection = projection;
            sourceTile.resolution = sourceTileGrid.getResolution(sourceTileCoord[0]);
            this.sourceTiles_[tileKey] = sourceTile;
            empty = empty && sourceTile.getState() === TileState.EMPTY;
            listen(sourceTile, EventType.CHANGE, this.handleTileChange, this);
            sourceTile.load();
          } else {
            empty = false;
          }
          covered = false;
          if (!sourceTile) {
            return;
          }
          if (sourceTile.getState() !== TileState.EMPTY && tile.getState() === TileState.IDLE) {
            tile.loadingSourceTiles++;
            const key = listen(sourceTile, EventType.CHANGE, function() {
              const state = sourceTile.getState();
              const sourceTileKey = getKey(sourceTile.tileCoord);
              if (state === TileState.LOADED || state === TileState.ERROR) {
                if (state === TileState.LOADED) {
                  unlistenByKey(key);
                  tile.loadingSourceTiles--;
                  delete tile.errorSourceTileKeys[sourceTileKey];
                } else if (state === TileState.ERROR) {
                  tile.errorSourceTileKeys[sourceTileKey] = true;
                }
                if (tile.loadingSourceTiles - Object.keys(tile.errorSourceTileKeys).length === 0) {
                  tile.hifi = true;
                  tile.sourceZ = sourceZ;
                  tile.setState(isEmpty(tile.errorSourceTileKeys) ? TileState.LOADED : TileState.ERROR);
                }
              }
            });
          }
        }.bind(this));
        if (!covered) {
          sourceTiles.length = 0;
        }
      } while (!covered && loadedZ > minZoom);
      if (!empty && tile.getState() === TileState.IDLE) {
        tile.setState(TileState.LOADING);
      }
      if (covered || empty) {
        tile.hifi = sourceZ === loadedZ;
        tile.sourceZ = loadedZ;
        const previousSourceTiles = this.sourceTilesByTileKey_[getKey(tile.tileCoord)];
        if (tile.getState() < TileState.LOADED) {
          tile.setState(empty ? TileState.EMPTY : TileState.LOADED);
        } else if (!previousSourceTiles || !equals(sourceTiles, previousSourceTiles)) {
          this.removeSourceTiles(tile);
          this.addSourceTiles(tile, sourceTiles);
        }
      }
    }
    return sourceTiles;
  }

  /**
   * @param {VectorRenderTile} tile Tile.
   * @param {Array<import("../VectorTile").default>} sourceTiles Source tiles.
   */
  addSourceTiles(tile, sourceTiles) {
    this.sourceTilesByTileKey_[getKey(tile.tileCoord)] = sourceTiles;
    for (let i = 0, ii = sourceTiles.length; i < ii; ++i) {
      sourceTiles[i].consumers++;
    }
  }

  /**
   * @param {VectorRenderTile} tile Tile.
   */
  removeSourceTiles(tile) {
    const tileKey = getKey(tile.tileCoord);
    if (tileKey in this.sourceTilesByTileKey_) {
      const sourceTiles = this.sourceTilesByTileKey_[tileKey];
      for (let i = 0, ii = sourceTiles.length; i < ii; ++i) {
        const sourceTile = sourceTiles[i];
        sourceTile.consumers--;
        if (sourceTile.consumers === 0) {
          sourceTile.dispose();
          delete this.sourceTiles_[getKey(sourceTile.tileCoord)];
        }
      }
    }
    delete this.sourceTilesByTileKey_[tileKey];
  }

  /**
   * @inheritDoc
   */
  getTile(z, x, y, pixelRatio, projection) {
    const tileCoordKey = getKeyZXY(z, x, y);
    if (this.tileCache.containsKey(tileCoordKey)) {
      return (
        /** @type {!import("../Tile.js").default} */ (this.tileCache.get(tileCoordKey))
      );
    } else {
      const tileCoord = [z, x, y];
      const urlTileCoord = this.getTileCoordForTileUrlFunction(
        tileCoord, projection);
      const tile = new VectorRenderTile(
        tileCoord,
        urlTileCoord !== null ? TileState.IDLE : TileState.EMPTY,
        urlTileCoord,
        this.tileGrid,
        this.getSourceTiles.bind(this, pixelRatio, projection),
        this.removeSourceTiles.bind(this));

      tile.key = this.getRevision().toString();
      this.tileCache.set(tileCoordKey, tile);
      return tile;
    }
  }

  /**
   * @inheritDoc
   */
  getTileGridForProjection(projection) {
    const code = projection.getCode();
    let tileGrid = this.tileGrids_[code];
    if (!tileGrid) {
      // A tile grid that matches the tile size of the source tile grid is more
      // likely to have 1:1 relationships between source tiles and rendered tiles.
      const sourceTileGrid = this.tileGrid;
      tileGrid = this.tileGrids_[code] = createForProjection(projection, undefined,
        sourceTileGrid ? sourceTileGrid.getTileSize(sourceTileGrid.getMinZoom()) : undefined);
    }
    return tileGrid;
  }

  /**
   * @inheritDoc
   */
  getTilePixelRatio(pixelRatio) {
    return pixelRatio;
  }

  /**
   * @inheritDoc
   */
  getTilePixelSize(z, pixelRatio, projection) {
    const tileGrid = this.getTileGridForProjection(projection);
    const tileSize = toSize(tileGrid.getTileSize(z), this.tmpSize);
    return [Math.round(tileSize[0] * pixelRatio), Math.round(tileSize[1] * pixelRatio)];
  }
}


export default VectorTile;


/**
 * Sets the loader for a tile.
 * @param {import("../VectorTile.js").default} tile Vector tile.
 * @param {string} url URL.
 */
export function defaultLoadFunction(tile, url) {
  const loader = loadFeaturesXhr(url, tile.getFormat(), tile.onLoad.bind(tile), tile.onError.bind(tile));
  tile.setLoader(loader);
}
