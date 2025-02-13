/**
 * @module ol/source/DataTile
 */
import DataTile from '../DataTile.js';
import TileState from '../TileState.js';
import EventType from '../events/EventType.js';
import {toPromise} from '../functions.js';
import {equivalent, get as getProjection} from '../proj.js';
import ReprojDataTile from '../reproj/DataTile.js';
import {toSize} from '../size.js';
import {
  createXYZ,
  extentFromProjection,
  getForProjection as getTileGridForProjection,
} from '../tilegrid.js';
import {getUid} from '../util.js';
import TileSource, {TileSourceEvent} from './Tile.js';
import TileEventType from './TileEventType.js';

/**
 * @typedef {'anonymous'|'use-credentials'} CrossOriginAttribute
 */

/**
 * @typedef {Object} LoaderOptions
 * @property {AbortSignal} signal An abort controller signal.
 * @property {CrossOriginAttribute} [crossOrigin] The cross-origin attribute for images.
 * @property {number} [maxY] The maximum y coordinate at the given z level.  Will be undefined if the
 * underlying tile grid does not have a known extent.
 */

/**
 * Data tile loading function.  The function is called with z, x, and y tile coordinates and
 * returns {@link import("../DataTile.js").Data data} for a tile or a promise for the same.
 * @typedef {function(number, number, number, LoaderOptions) : (import("../DataTile.js").Data|Promise<import("../DataTile.js").Data>)} Loader
 */

/**
 * @typedef {Object} Options
 * @property {Loader} [loader] Data loader.  Called with z, x, and y tile coordinates.
 * Returns {@link import("../DataTile.js").Data data} for a tile or a promise for the same.
 * For loaders that generate images, the promise should not resolve until the image is loaded.
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [maxZoom=42] Optional max zoom level. Not used if `tileGrid` is provided.
 * @property {number} [minZoom=0] Optional min zoom level. Not used if `tileGrid` is provided.
 * @property {number|import("../size.js").Size} [tileSize=[256, 256]] The pixel width and height of the source tiles.
 * This may be different than the rendered pixel size if a `tileGrid` is provided.
 * @property {number} [gutter=0] The size in pixels of the gutter around data tiles to ignore.
 * This allows artifacts of rendering at tile edges to be ignored.
 * Supported data should be wider and taller than the tile size by a value of `2 x gutter`.
 * @property {number} [maxResolution] Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Tile projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {import("./Source.js").State} [state] The source state.
 * @property {boolean} [wrapX=false] Render tiles beyond the antimeridian.
 * @property {number} [transition] Transition time when fading in new tiles (in milliseconds).
 * @property {number} [bandCount=4] Number of bands represented in the data.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @property {CrossOriginAttribute} [crossOrigin='anonymous'] The crossOrigin property to pass to loaders for image data.
 * @property {string} [key] Key for use in caching tiles.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

/**
 * @classdesc
 * A source for typed array data tiles.
 *
 * @fires import("./Tile.js").TileSourceEvent
 * @template {import("../Tile.js").default} [TileType=DataTile]
 * @extends TileSource<TileType>
 * @api
 */
class DataTileSource extends TileSource {
  /**
   * @param {Options} options DataTile source options.
   */
  constructor(options) {
    const projection =
      options.projection === undefined ? 'EPSG:3857' : options.projection;

    let tileGrid = options.tileGrid;
    if (tileGrid === undefined && projection) {
      tileGrid = createXYZ({
        extent: extentFromProjection(projection),
        maxResolution: options.maxResolution,
        maxZoom: options.maxZoom,
        minZoom: options.minZoom,
        tileSize: options.tileSize,
      });
    }

    super({
      cacheSize: 0.1, // don't cache on the source
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      projection: projection,
      tileGrid: tileGrid,
      state: options.state,
      wrapX: options.wrapX,
      transition: options.transition,
      interpolate: options.interpolate,
      key: options.key,
      zDirection: options.zDirection,
    });

    /**
     * @private
     * @type {number}
     */
    this.gutter_ = options.gutter !== undefined ? options.gutter : 0;

    /**
     * @private
     * @type {import('../size.js').Size|null}
     */
    this.tileSize_ = options.tileSize ? toSize(options.tileSize) : null;

    /**
     * @private
     * @type {Array<import('../size.js').Size>|null}
     */
    this.tileSizes_ = null;

    /**
     * @private
     * @type {!Object<string, boolean>}
     */
    this.tileLoadingKeys_ = {};

    /**
     * @private
     */
    this.loader_ = options.loader;

    /**
     * @private
     */
    this.handleTileChange_ = this.handleTileChange_.bind(this);

    /**
     * @type {number}
     */
    this.bandCount = options.bandCount === undefined ? 4 : options.bandCount; // assume RGBA if undefined

    /**
     * @private
     * @type {!Object<string, import("../tilegrid/TileGrid.js").default>}
     */
    this.tileGridForProjection_ = {};

    /**
     * @private
     * @type {CrossOriginAttribute}
     */
    this.crossOrigin_ = options.crossOrigin || 'anonymous';

    /**
     * @type {import("../transform.js").Transform|null}
     */
    this.transformMatrix = null;
  }

  /**
   * Set the source tile sizes.  The length of the array is expected to match the number of
   * levels in the tile grid.
   * @protected
   * @param {Array<import('../size.js').Size>} tileSizes An array of tile sizes.
   */
  setTileSizes(tileSizes) {
    this.tileSizes_ = tileSizes;
  }

  /**
   * Get the source tile size at the given zoom level.  This may be different than the rendered tile
   * size.
   * @protected
   * @param {number} z Tile zoom level.
   * @return {import('../size.js').Size} The source tile size.
   */
  getTileSize(z) {
    if (this.tileSizes_) {
      return this.tileSizes_[z];
    }
    if (this.tileSize_) {
      return this.tileSize_;
    }
    const tileGrid = this.getTileGrid();
    return tileGrid ? toSize(tileGrid.getTileSize(z)) : [256, 256];
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {number} Gutter.
   * @override
   */
  getGutterForProjection(projection) {
    const thisProj = this.getProjection();
    if (
      (!thisProj || equivalent(thisProj, projection)) &&
      !this.transformMatrix
    ) {
      return this.gutter_;
    }

    return 0;
  }

  /**
   * @param {Loader} loader The data loader.
   * @protected
   */
  setLoader(loader) {
    this.loader_ = loader;
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {import("../proj/Projection.js").default} targetProj The output projection.
   * @param {import("../proj/Projection.js").default} sourceProj The input projection.
   * @return {!TileType} Tile.
   */
  getReprojTile_(z, x, y, targetProj, sourceProj) {
    const sourceTileGrid =
      this.tileGrid || this.getTileGridForProjection(sourceProj || targetProj);
    const reprojTilePixelRatio = Math.max.apply(
      null,
      sourceTileGrid.getResolutions().map((r, z) => {
        const tileSize = toSize(sourceTileGrid.getTileSize(z));
        const textureSize = this.getTileSize(z);
        return Math.max(
          textureSize[0] / tileSize[0],
          textureSize[1] / tileSize[1],
        );
      }),
    );

    const targetTileGrid = this.getTileGridForProjection(targetProj);
    const tileCoord = [z, x, y];
    const wrappedTileCoord = this.getTileCoordForTileUrlFunction(
      tileCoord,
      targetProj,
    );

    const options = Object.assign(
      {
        sourceProj: sourceProj || targetProj,
        sourceTileGrid,
        targetProj,
        targetTileGrid,
        tileCoord,
        wrappedTileCoord,
        pixelRatio: reprojTilePixelRatio,
        gutter: this.gutter_,
        getTileFunction: (z, x, y, pixelRatio) =>
          this.getTile(z, x, y, pixelRatio),
        transformMatrix: this.transformMatrix,
      },
      /** @type {import("../reproj/DataTile.js").Options} */ (this.tileOptions),
    );
    const tile = /** @type {TileType} */ (
      /** @type {*} */ (new ReprojDataTile(options))
    );
    tile.key = this.getKey();
    return tile;
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} [projection] Projection.
   * @return {TileType|null} Tile (or null if outside source extent).
   * @override
   */
  getTile(z, x, y, pixelRatio, projection) {
    const sourceProjection = this.getProjection();
    if (
      projection &&
      ((sourceProjection && !equivalent(sourceProjection, projection)) ||
        this.transformMatrix)
    ) {
      return this.getReprojTile_(z, x, y, projection, sourceProjection);
    }

    const size = this.getTileSize(z);

    const sourceLoader = this.loader_;

    const controller = new AbortController();

    /**
     * @type {LoaderOptions}
     */
    const loaderOptions = {
      signal: controller.signal,
      crossOrigin: this.crossOrigin_,
    };

    const tileCoord = this.getTileCoordForTileUrlFunction([z, x, y]);
    if (!tileCoord) {
      return null;
    }

    const requestZ = tileCoord[0];
    const requestX = tileCoord[1];
    const requestY = tileCoord[2];
    const range = this.getTileGrid()?.getFullTileRange(requestZ);
    if (range) {
      loaderOptions.maxY = range.getHeight() - 1;
    }
    function loader() {
      return toPromise(function () {
        return sourceLoader(requestZ, requestX, requestY, loaderOptions);
      });
    }

    /**
     * @type {import("../DataTile.js").Options}
     */
    const options = Object.assign(
      {
        tileCoord: [z, x, y],
        loader: loader,
        size: size,
        controller: controller,
      },
      this.tileOptions,
    );

    const tile = /** @type {TileType} */ (
      /** @type {*} */ (new DataTile(options))
    );
    tile.key = this.getKey();
    tile.addEventListener(EventType.CHANGE, this.handleTileChange_);

    return tile;
  }

  /**
   * Handle tile change events.
   * @param {import("../events/Event.js").default} event Event.
   */
  handleTileChange_(event) {
    const tile = /** @type {import("../Tile.js").default} */ (event.target);
    const uid = getUid(tile);
    const tileState = tile.getState();
    let type;
    if (tileState == TileState.LOADING) {
      this.tileLoadingKeys_[uid] = true;
      type = TileEventType.TILELOADSTART;
    } else if (uid in this.tileLoadingKeys_) {
      delete this.tileLoadingKeys_[uid];
      type =
        tileState == TileState.ERROR
          ? TileEventType.TILELOADERROR
          : tileState == TileState.LOADED
            ? TileEventType.TILELOADEND
            : undefined;
    }
    if (type) {
      this.dispatchEvent(new TileSourceEvent(type, tile));
    }
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!import("../tilegrid/TileGrid.js").default} Tile grid.
   * @override
   */
  getTileGridForProjection(projection) {
    const thisProj = this.getProjection();
    if (
      this.tileGrid &&
      (!thisProj || equivalent(thisProj, projection)) &&
      !this.transformMatrix
    ) {
      return this.tileGrid;
    }

    const projKey = getUid(projection);
    if (!(projKey in this.tileGridForProjection_)) {
      this.tileGridForProjection_[projKey] =
        getTileGridForProjection(projection);
    }
    return this.tileGridForProjection_[projKey];
  }

  /**
   * Sets the tile grid to use when reprojecting the tiles to the given
   * projection instead of the default tile grid for the projection.
   *
   * This can be useful when the default tile grid cannot be created
   * (e.g. projection has no extent defined) or
   * for optimization reasons (custom tile size, resolutions, ...).
   *
   * @param {import("../proj.js").ProjectionLike} projection Projection.
   * @param {import("../tilegrid/TileGrid.js").default} tilegrid Tile grid to use for the projection.
   * @api
   */
  setTileGridForProjection(projection, tilegrid) {
    const proj = getProjection(projection);
    if (proj) {
      const projKey = getUid(proj);
      if (!(projKey in this.tileGridForProjection_)) {
        this.tileGridForProjection_[projKey] = tilegrid;
      }
    }
  }
}

export default DataTileSource;
