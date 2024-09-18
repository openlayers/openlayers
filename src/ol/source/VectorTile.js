/**
 * @module ol/source/VectorTile
 */

import EventType from '../events/EventType.js';
import Tile from '../VectorTile.js';
import TileGrid from '../tilegrid/TileGrid.js';
import TileState from '../TileState.js';
import UrlTile from './UrlTile.js';
import VectorRenderTile from '../VectorRenderTile.js';
import {DEFAULT_MAX_ZOOM} from '../tilegrid/common.js';
import {
  buffer as bufferExtent,
  getIntersection,
  intersects,
} from '../extent.js';
import {createXYZ, extentFromProjection} from '../tilegrid.js';
import {isEmpty} from '../obj.js';
import {loadFeaturesXhr} from '../featureloader.js';
import {toSize} from '../size.js';

/**
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../render/Feature.js").default]
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Initial tile cache size. Will auto-grow to hold at least twice the number of tiles in the viewport.
 * @property {import("../extent.js").Extent} [extent] Extent.
 * @property {import("../format/Feature.js").default<FeatureType>} [format] Feature format for tiles. Used and required by the default.
 * @property {boolean} [overlaps=true] This source may have overlapping geometries. Setting this
 * to `false` (e.g. for sources with polygons that represent administrative
 * boundaries or TopoJSON sources) allows the renderer to optimise fill and
 * stroke operations.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Projection of the tile grid.
 * @property {import("./Source.js").State} [state] Source state.
 * @property {typeof import("../VectorTile.js").default} [tileClass] Class used to instantiate tiles.
 * Default is {@link module:ol/VectorTile~VectorTile}.
 * @property {number} [maxZoom=22] Optional max zoom level. Not used if `tileGrid` is provided.
 * @property {number} [minZoom] Optional min zoom level. Not used if `tileGrid` is provided.
 * @property {number|import("../size.js").Size} [tileSize=512] Optional tile size. Not used if `tileGrid` is provided.
 * @property {number} [maxResolution] Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
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
 * If you do not need extent, resolution and projection to get the features for a tile (e.g.
 * for GeoJSON tiles), your `tileLoadFunction` does not need a `setLoader()` call. Only make sure
 * to call `setFeatures()` on the tile:
 * ```js
 * const format = new GeoJSON({featureProjection: map.getView().getProjection()});
 * async function tileLoadFunction(tile, url) {
 *   const response = await fetch(url);
 *   const data = await response.json();
 *   tile.setFeatures(format.readFeatures(data));
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
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=1]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

/**
 * @classdesc
 * Class for layer sources providing vector data divided into a tile grid, to be
 * used with {@link module:ol/layer/VectorTile~VectorTileLayer}. Although this source receives tiles
 * with vector features from the server, it is not meant for feature editing.
 * Features are optimized for rendering, their geometries are clipped at or near
 * tile boundaries and simplified for a view resolution. See
 * {@link module:ol/source/Vector~VectorSource} for vector sources that are suitable for feature
 * editing.
 *
 * @fires import("./Tile.js").TileSourceEvent
 * @api
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../render/Feature.js").default]
 */
class VectorTile extends UrlTile {
  /**
   * @param {!Options<FeatureType>} options Vector tile options.
   */
  constructor(options) {
    const projection = options.projection || 'EPSG:3857';

    const extent = options.extent || extentFromProjection(projection);

    const tileGrid =
      options.tileGrid ||
      createXYZ({
        extent: extent,
        maxResolution: options.maxResolution,
        maxZoom: options.maxZoom !== undefined ? options.maxZoom : 22,
        minZoom: options.minZoom,
        tileSize: options.tileSize || 512,
      });

    super({
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      cacheSize: options.cacheSize,
      interpolate: true,
      projection: projection,
      state: options.state,
      tileGrid: tileGrid,
      tileLoadFunction: options.tileLoadFunction
        ? options.tileLoadFunction
        : defaultLoadFunction,
      tileUrlFunction: options.tileUrlFunction,
      url: options.url,
      urls: options.urls,
      wrapX: options.wrapX === undefined ? true : options.wrapX,
      transition: options.transition,
      zDirection: options.zDirection === undefined ? 1 : options.zDirection,
    });

    /**
     * @private
     * @type {import("../format/Feature.js").default<FeatureType>|null}
     */
    this.format_ = options.format ? options.format : null;

    /**
     * @type {Object<string, Array<string>>}
     * @private
     */
    this.tileKeysBySourceTileUrl_ = {};

    /**
     @type {Object<string, Tile<FeatureType>>}
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
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection").default} projection Projection.
   * @param {VectorRenderTile} tile Vector render tile.
   * @return {Array<import("../VectorTile").default>} Tile keys.
   */
  getSourceTiles(pixelRatio, projection, tile) {
    if (tile.getState() === TileState.IDLE) {
      tile.setState(TileState.LOADING);
      const urlTileCoord = tile.wrappedTileCoord;
      const tileGrid = this.getTileGridForProjection(projection);
      const extent = tileGrid.getTileCoordExtent(urlTileCoord);
      const z = urlTileCoord[0];
      const resolution = tileGrid.getResolution(z);
      // make extent 1 pixel smaller so we don't load tiles for < 0.5 pixel render space
      bufferExtent(extent, -resolution, extent);
      const sourceTileGrid = this.tileGrid;
      const sourceExtent = sourceTileGrid.getExtent();
      if (sourceExtent) {
        getIntersection(extent, sourceExtent, extent);
      }
      const sourceZ = sourceTileGrid.getZForResolution(
        resolution,
        this.zDirection,
      );

      sourceTileGrid.forEachTileCoord(extent, sourceZ, (sourceTileCoord) => {
        const tileUrl = this.tileUrlFunction(
          sourceTileCoord,
          pixelRatio,
          projection,
        );
        if (!this.sourceTiles_[tileUrl]) {
          this.sourceTiles_[tileUrl] = new this.tileClass(
            sourceTileCoord,
            tileUrl ? TileState.IDLE : TileState.EMPTY,
            tileUrl,
            this.format_,
            this.tileLoadFunction,
          );
        }
        const sourceTile = this.sourceTiles_[tileUrl];
        tile.sourceTiles.push(sourceTile);
        if (!this.tileKeysBySourceTileUrl_[tileUrl]) {
          this.tileKeysBySourceTileUrl_[tileUrl] = [];
        }
        this.tileKeysBySourceTileUrl_[tileUrl].push(tile.getKey());
        const sourceTileState = sourceTile.getState();
        if (sourceTileState < TileState.LOADED) {
          const listenChange = (event) => {
            this.handleTileChange(event);
            const state = sourceTile.getState();
            if (state === TileState.LOADED || state === TileState.ERROR) {
              const sourceTileKey = sourceTile.getKey();
              if (sourceTileKey in tile.errorTileKeys) {
                if (sourceTile.getState() === TileState.LOADED) {
                  delete tile.errorTileKeys[sourceTileKey];
                }
              } else {
                tile.loadingSourceTiles--;
              }
              if (state === TileState.ERROR) {
                tile.errorTileKeys[sourceTileKey] = true;
              } else {
                sourceTile.removeEventListener(EventType.CHANGE, listenChange);
              }
              if (tile.loadingSourceTiles === 0) {
                tile.setState(
                  isEmpty(tile.errorTileKeys)
                    ? TileState.LOADED
                    : TileState.ERROR,
                );
              }
            }
          };
          sourceTile.addEventListener(EventType.CHANGE, listenChange);
          tile.loadingSourceTiles++;
        }
        if (sourceTileState === TileState.IDLE) {
          sourceTile.extent =
            sourceTileGrid.getTileCoordExtent(sourceTileCoord);
          sourceTile.projection = projection;
          sourceTile.resolution = sourceTileGrid.getResolution(
            sourceTileCoord[0],
          );
          sourceTile.load();
        }
      });
      if (!tile.loadingSourceTiles) {
        tile.setState(
          tile.sourceTiles.some(
            (sourceTile) => sourceTile.getState() === TileState.ERROR,
          )
            ? TileState.ERROR
            : TileState.LOADED,
        );
      }
    }

    return tile.sourceTiles;
  }

  /**
   * @param {VectorRenderTile} tile Vector render tile.
   */
  removeSourceTiles(tile) {
    const sourceTiles = tile.sourceTiles;
    for (let i = 0, ii = sourceTiles.length; i < ii; ++i) {
      const sourceTileUrl = sourceTiles[i].getTileUrl();
      const tileKey = this.getKey();
      if (!this.tileKeysBySourceTileUrl_[sourceTileUrl]) {
        return;
      }
      const index = this.tileKeysBySourceTileUrl_[sourceTileUrl][tileKey];
      if (index === -1) {
        continue;
      }
      this.tileKeysBySourceTileUrl_[sourceTileUrl].splice(index, 1);
      if (this.tileKeysBySourceTileUrl_[sourceTileUrl].length === 0) {
        delete this.tileKeysBySourceTileUrl_[sourceTileUrl];
        delete this.sourceTiles_[sourceTileUrl];
      }
    }
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!VectorRenderTile} Tile.
   * @override
   */
  getTile(z, x, y, pixelRatio, projection) {
    const tileCoord = [z, x, y];
    let urlTileCoord = this.getTileCoordForTileUrlFunction(
      tileCoord,
      projection,
    );
    const sourceExtent = this.getTileGrid().getExtent();
    const tileGrid = this.getTileGridForProjection(projection);
    if (urlTileCoord && sourceExtent) {
      const tileExtent = tileGrid.getTileCoordExtent(urlTileCoord);
      // make extent 1 pixel smaller so we don't load tiles for < 0.5 pixel render space
      bufferExtent(tileExtent, -tileGrid.getResolution(z), tileExtent);
      if (!intersects(sourceExtent, tileExtent)) {
        urlTileCoord = null;
      }
    }
    let empty = true;
    if (urlTileCoord !== null) {
      const sourceTileGrid = this.tileGrid;
      const resolution = tileGrid.getResolution(z);
      const sourceZ = sourceTileGrid.getZForResolution(resolution, 1);
      // make extent 1 pixel smaller so we don't load tiles for < 0.5 pixel render space
      const extent = tileGrid.getTileCoordExtent(urlTileCoord);
      bufferExtent(extent, -resolution, extent);
      sourceTileGrid.forEachTileCoord(extent, sourceZ, (sourceTileCoord) => {
        empty =
          empty &&
          !this.tileUrlFunction(sourceTileCoord, pixelRatio, projection);
      });
    }
    const newTile = new VectorRenderTile(
      tileCoord,
      empty ? TileState.EMPTY : TileState.IDLE,
      urlTileCoord,
      this.getSourceTiles.bind(this, pixelRatio, projection),
      this.removeSourceTiles.bind(this),
    );
    newTile.key = this.getKey();
    return newTile;
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!import("../tilegrid/TileGrid.js").default} Tile grid.
   * @override
   */
  getTileGridForProjection(projection) {
    const code = projection.getCode();
    let tileGrid = this.tileGrids_[code];
    if (!tileGrid) {
      // A tile grid that matches the tile size of the source tile grid is more
      // likely to have 1:1 relationships between source tiles and rendered tiles.
      const sourceTileGrid = this.tileGrid;
      const resolutions = sourceTileGrid.getResolutions().slice();
      const origins = resolutions.map(function (resolution, z) {
        return sourceTileGrid.getOrigin(z);
      });
      const tileSizes = resolutions.map(function (resolution, z) {
        return sourceTileGrid.getTileSize(z);
      });
      const length = DEFAULT_MAX_ZOOM + 1;
      for (let z = resolutions.length; z < length; ++z) {
        resolutions.push(resolutions[z - 1] / 2);
        origins.push(origins[z - 1]);
        tileSizes.push(tileSizes[z - 1]);
      }
      tileGrid = new TileGrid({
        extent: sourceTileGrid.getExtent(),
        origins: origins,
        resolutions: resolutions,
        tileSizes: tileSizes,
      });
      this.tileGrids_[code] = tileGrid;
    }
    return tileGrid;
  }

  /**
   * Get the tile pixel ratio for this source.
   * @param {number} pixelRatio Pixel ratio.
   * @return {number} Tile pixel ratio.
   * @override
   */
  getTilePixelRatio(pixelRatio) {
    return pixelRatio;
  }

  /**
   * @param {number} z Z.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../size.js").Size} Tile size.
   * @override
   */
  getTilePixelSize(z, pixelRatio, projection) {
    const tileGrid = this.getTileGridForProjection(projection);
    const tileSize = toSize(tileGrid.getTileSize(z), this.tmpSize);
    return [
      Math.round(tileSize[0] * pixelRatio),
      Math.round(tileSize[1] * pixelRatio),
    ];
  }
}

export default VectorTile;

/**
 * Sets the loader for a tile.
 * @template {import("../Feature.js").FeatureLike} [FeatureType=import("../render/Feature.js").default]
 * @param {import("../VectorTile.js").default<FeatureType>} tile Vector tile.
 * @param {string} url URL.
 */
export function defaultLoadFunction(tile, url) {
  tile.setLoader(
    /**
     * @param {import("../extent.js").Extent} extent Extent.
     * @param {number} resolution Resolution.
     * @param {import("../proj/Projection.js").default} projection Projection.
     */
    function (extent, resolution, projection) {
      loadFeaturesXhr(
        url,
        tile.getFormat(),
        extent,
        resolution,
        projection,
        tile.onLoad.bind(tile),
        tile.onError.bind(tile),
      );
    },
  );
}
