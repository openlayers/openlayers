/**
 * @module ol/source/TileImage
 */
import EventType from '../events/EventType.js';
import ImageTile from '../ImageTile.js';
import ReprojTile from '../reproj/Tile.js';
import TileState from '../TileState.js';
import UrlTile from './UrlTile.js';
import {equivalent, get as getProjection} from '../proj.js';
import {getForProjection as getTileGridForProjection} from '../tilegrid.js';
import {getUid} from '../util.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Deprecated.  Use the cacheSize option on the layer instead.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {import("./Source.js").State} [state] Source state.
 * @property {typeof import("../ImageTile.js").default} [tileClass] Class used to instantiate image tiles.
 * Default is {@link module:ol/ImageTile~ImageTile}.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction] Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {number} [tilePixelRatio=1] The pixel ratio used by the tile service. For example, if the tile
 * service advertizes 256px by 256px tiles but actually sends 512px
 * by 512px images (for retina/hidpi devices) then `tilePixelRatio`
 * should be set to `2`.
 * @property {import("../Tile.js").UrlFunction} [tileUrlFunction] Deprecated.  Use an ImageTile source and provide a function
 * for the url option instead.
 * @property {string} [url] URL template. Must include `{x}`, `{y}` or `{-y}`, and `{z}` placeholders.
 * A `{?-?}` template pattern, for example `subdomain{a-f}.domain.com`, may be
 * used instead of defining each one separately in the `urls` option.
 * @property {Array<string>} [urls] An array of URL templates.
 * @property {boolean} [wrapX] Whether to wrap the world horizontally. The default, is to
 * request out-of-bounds tiles from the server. When set to `false`, only one
 * world will be rendered. When set to `true`, tiles will be requested for one
 * world only, but they will be wrapped horizontally to render multiple worlds.
 * @property {number} [transition] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {string} [key] Optional tile key for proper cache fetching
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

/**
 * @deprecated Use the ol/source/ImageTile.js instead.
 *
 * @fires import("./Tile.js").TileSourceEvent
 * @api
 */
class TileImage extends UrlTile {
  /**
   * @param {!Options} options Image tile options.
   */
  constructor(options) {
    super({
      attributions: options.attributions,
      cacheSize: options.cacheSize,
      projection: options.projection,
      state: options.state,
      tileGrid: options.tileGrid,
      tileLoadFunction: options.tileLoadFunction
        ? options.tileLoadFunction
        : defaultTileLoadFunction,
      tilePixelRatio: options.tilePixelRatio,
      tileUrlFunction: options.tileUrlFunction,
      url: options.url,
      urls: options.urls,
      wrapX: options.wrapX,
      transition: options.transition,
      interpolate:
        options.interpolate !== undefined ? options.interpolate : true,
      key: options.key,
      attributionsCollapsible: options.attributionsCollapsible,
      zDirection: options.zDirection,
    });

    /**
     * @protected
     * @type {?string}
     */
    this.crossOrigin =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

    /**
     * @protected
     * @type {typeof ImageTile}
     */
    this.tileClass =
      options.tileClass !== undefined ? options.tileClass : ImageTile;

    /**
     * @protected
     * @type {!Object<string, import("../tilegrid/TileGrid.js").default>}
     */
    this.tileGridForProjection = {};

    /**
     * @private
     * @type {number|undefined}
     */
    this.reprojectionErrorThreshold_ = options.reprojectionErrorThreshold;

    /**
     * @private
     * @type {boolean}
     */
    this.renderReprojectionEdges_ = false;
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {number} Gutter.
   * @override
   */
  getGutterForProjection(projection) {
    if (
      this.getProjection() &&
      projection &&
      !equivalent(this.getProjection(), projection)
    ) {
      return 0;
    }
    return this.getGutter();
  }

  /**
   * @return {number} Gutter.
   */
  getGutter() {
    return 0;
  }

  /**
   * Return the key to be used for all tiles in the source.
   * @return {string} The key for all tiles.
   * @override
   */
  getKey() {
    let key = super.getKey();
    if (!this.getInterpolate()) {
      key += ':disable-interpolation';
    }
    return key;
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!import("../tilegrid/TileGrid.js").default} Tile grid.
   * @override
   */
  getTileGridForProjection(projection) {
    const thisProj = this.getProjection();
    if (this.tileGrid && (!thisProj || equivalent(thisProj, projection))) {
      return this.tileGrid;
    }
    const projKey = getUid(projection);
    if (!(projKey in this.tileGridForProjection)) {
      this.tileGridForProjection[projKey] =
        getTileGridForProjection(projection);
    }
    return this.tileGridForProjection[projKey];
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @param {string} key The key set on the tile.
   * @return {!ImageTile} Tile.
   * @private
   */
  createTile_(z, x, y, pixelRatio, projection, key) {
    const tileCoord = [z, x, y];
    const urlTileCoord = this.getTileCoordForTileUrlFunction(
      tileCoord,
      projection,
    );
    const tileUrl = urlTileCoord
      ? this.tileUrlFunction(urlTileCoord, pixelRatio, projection)
      : undefined;
    const tile = new this.tileClass(
      tileCoord,
      tileUrl !== undefined ? TileState.IDLE : TileState.EMPTY,
      tileUrl !== undefined ? tileUrl : '',
      this.crossOrigin,
      this.tileLoadFunction,
      this.tileOptions,
    );
    tile.key = key;
    tile.addEventListener(EventType.CHANGE, this.handleTileChange.bind(this));
    return tile;
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!(ImageTile|ReprojTile)} Tile.
   * @override
   */
  getTile(z, x, y, pixelRatio, projection) {
    const sourceProjection = this.getProjection();
    if (
      !sourceProjection ||
      !projection ||
      equivalent(sourceProjection, projection)
    ) {
      return this.getTileInternal(
        z,
        x,
        y,
        pixelRatio,
        sourceProjection || projection,
      );
    }
    const tileCoord = [z, x, y];
    const key = this.getKey();
    const sourceTileGrid = this.getTileGridForProjection(sourceProjection);
    const targetTileGrid = this.getTileGridForProjection(projection);
    const wrappedTileCoord = this.getTileCoordForTileUrlFunction(
      tileCoord,
      projection,
    );
    const tile = new ReprojTile(
      sourceProjection,
      sourceTileGrid,
      projection,
      targetTileGrid,
      tileCoord,
      wrappedTileCoord,
      this.getTilePixelRatio(pixelRatio),
      this.getGutter(),
      (z, x, y, pixelRatio) =>
        this.getTileInternal(z, x, y, pixelRatio, sourceProjection),
      this.reprojectionErrorThreshold_,
      this.renderReprojectionEdges_,
      this.tileOptions,
    );
    tile.key = key;
    return tile;
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {!import("../proj/Projection.js").default} projection Projection.
   * @return {!ImageTile} Tile.
   * @protected
   */
  getTileInternal(z, x, y, pixelRatio, projection) {
    const key = this.getKey();
    return this.createTile_(z, x, y, pixelRatio, projection, key);
  }

  /**
   * Sets whether to render reprojection edges or not (usually for debugging).
   * @param {boolean} render Render the edges.
   * @api
   */
  setRenderReprojectionEdges(render) {
    if (this.renderReprojectionEdges_ == render) {
      return;
    }
    this.renderReprojectionEdges_ = render;
    this.changed();
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
      if (!(projKey in this.tileGridForProjection)) {
        this.tileGridForProjection[projKey] = tilegrid;
      }
    }
  }
}

/**
 * @param {ImageTile} imageTile Image tile.
 * @param {string} src Source.
 */
function defaultTileLoadFunction(imageTile, src) {
  /** @type {HTMLImageElement|HTMLVideoElement} */ (imageTile.getImage()).src =
    src;
}

export default TileImage;
