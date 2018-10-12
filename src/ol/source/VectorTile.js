/**
 * @module ol/source/VectorTile
 */

import TileState from '../TileState.js';
import VectorImageTile, {defaultLoadFunction} from '../VectorImageTile.js';
import Tile from '../VectorTile.js';
import {toSize} from '../size.js';
import UrlTile from './UrlTile.js';
import {getKeyZXY} from '../tilecoord.js';
import {createXYZ, extentFromProjection, createForProjection} from '../tilegrid.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {number} [cacheSize=128] Cache size.
 * @property {import("../extent.js").Extent} [extent]
 * @property {import("../format/Feature.js").default} [format] Feature format for tiles. Used and required by the default.
 * @property {boolean} [overlaps=true] This source may have overlapping geometries. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {import("../proj.js").ProjectionLike} projection Projection.
 * @property {import("./State.js").default} [state] Source state.
 * @property {typeof import("../VectorTile.js").default} [tileClass] Class used to instantiate image tiles.
 * Default is {@link module:ol/VectorTile}.
 * @property {number} [maxZoom=22] Optional max zoom level.
 * @property {number} [minZoom] Optional min zoom level.
 * @property {number|import("../size.js").Size} [tileSize=512] Optional tile size.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction]
 * Optional function to load a tile given a URL. Could look like this:
 * ```js
 * function(tile, url) {
 *   tile.setLoader(function() {
 *     var data = // ... fetch data
 *     var format = tile.getFormat();
 *     tile.setProjection(format.readProjection(data));
 *     tile.setFeatures(format.readFeatures(data, {
 *       // featureProjection is not required for ol/format/MVT
 *       featureProjection: map.getView().getProjection()
 *     }));
 *     // the line below is only required for ol/format/MVT
 *     tile.setExtent(format.getLastExtent());
 *   }
 * });
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
      cacheSize: options.cacheSize !== undefined ? options.cacheSize : 128,
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
       * @private
       * @type {Object<string, Tile>}
       */
    this.sourceTiles_ = {};

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
      const tile = new VectorImageTile(
        tileCoord,
        urlTileCoord !== null ? TileState.IDLE : TileState.EMPTY,
        this.getRevision(),
        this.format_, this.tileLoadFunction, urlTileCoord, this.tileUrlFunction,
        this.tileGrid, this.getTileGridForProjection(projection),
        this.sourceTiles_, pixelRatio, projection, this.tileClass,
        this.handleTileChange.bind(this), tileCoord[0]);

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
