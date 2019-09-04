/**
 * @module ol/source/TileImage
 */
import {ENABLE_RASTER_REPROJECTION} from '../reproj/common.js';
import {getUid} from '../util.js';
import ImageTile from '../ImageTile.js';
import TileCache from '../TileCache.js';
import TileState from '../TileState.js';
import EventType from '../events/EventType.js';
import {equivalent, get as getProjection} from '../proj.js';
import ReprojTile from '../reproj/Tile.js';
import UrlTile from './UrlTile.js';
import {getKey, getKeyZXY} from '../tilecoord.js';
import {getForProjection as getTileGridForProjection} from '../tilegrid.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Tile cache size. The default depends on the screen size. Will increase if too small.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {boolean} [opaque=true] Whether the layer is opaque.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {import("./State.js").default} [state] Source state.
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
 * @property {import("../Tile.js").UrlFunction} [tileUrlFunction] Optional function to get tile URL given a tile coordinate and the projection.
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
 * @property {number} [zDirection=0] Indicate which resolution should be used
 * by a renderer if the view resolution does not match any resolution of the tile source.
 * If 0, the nearest resolution will be used. If 1, the nearest lower resolution
 * will be used. If -1, the nearest higher resolution will be used.
 */


/**
 * @classdesc
 * Base class for sources providing images divided into a tile grid.
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
      opaque: options.opaque,
      projection: options.projection,
      state: options.state,
      tileGrid: options.tileGrid,
      tileLoadFunction: options.tileLoadFunction ?
        options.tileLoadFunction : defaultTileLoadFunction,
      tilePixelRatio: options.tilePixelRatio,
      tileUrlFunction: options.tileUrlFunction,
      url: options.url,
      urls: options.urls,
      wrapX: options.wrapX,
      transition: options.transition,
      key: options.key,
      attributionsCollapsible: options.attributionsCollapsible,
      zDirection: options.zDirection
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
    this.tileClass = options.tileClass !== undefined ?
      options.tileClass : ImageTile;

    /**
     * @protected
     * @type {!Object<string, TileCache>}
     */
    this.tileCacheForProjection = {};

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
   * @inheritDoc
   */
  canExpireCache() {
    if (!ENABLE_RASTER_REPROJECTION) {
      return super.canExpireCache();
    }
    if (this.tileCache.canExpireCache()) {
      return true;
    } else {
      for (const key in this.tileCacheForProjection) {
        if (this.tileCacheForProjection[key].canExpireCache()) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  expireCache(projection, usedTiles) {
    if (!ENABLE_RASTER_REPROJECTION) {
      super.expireCache(projection, usedTiles);
      return;
    }
    const usedTileCache = this.getTileCacheForProjection(projection);

    this.tileCache.expireCache(this.tileCache == usedTileCache ? usedTiles : {});
    for (const id in this.tileCacheForProjection) {
      const tileCache = this.tileCacheForProjection[id];
      tileCache.expireCache(tileCache == usedTileCache ? usedTiles : {});
    }
  }

  /**
   * @inheritDoc
   */
  getGutterForProjection(projection) {
    if (ENABLE_RASTER_REPROJECTION &&
        this.getProjection() && projection && !equivalent(this.getProjection(), projection)) {
      return 0;
    } else {
      return this.getGutter();
    }
  }

  /**
   * @return {number} Gutter.
   */
  getGutter() {
    return 0;
  }

  /**
   * @inheritDoc
   */
  getOpaque(projection) {
    if (ENABLE_RASTER_REPROJECTION &&
        this.getProjection() && projection && !equivalent(this.getProjection(), projection)) {
      return false;
    } else {
      return super.getOpaque(projection);
    }
  }

  /**
   * @inheritDoc
   */
  getTileGridForProjection(projection) {
    if (!ENABLE_RASTER_REPROJECTION) {
      return super.getTileGridForProjection(projection);
    }
    const thisProj = this.getProjection();
    if (this.tileGrid && (!thisProj || equivalent(thisProj, projection))) {
      return this.tileGrid;
    } else {
      const projKey = getUid(projection);
      if (!(projKey in this.tileGridForProjection)) {
        this.tileGridForProjection[projKey] = getTileGridForProjection(projection);
      }
      return (
        /** @type {!import("../tilegrid/TileGrid.js").default} */ (this.tileGridForProjection[projKey])
      );
    }
  }

  /**
   * @inheritDoc
   */
  getTileCacheForProjection(projection) {
    if (!ENABLE_RASTER_REPROJECTION) {
      return super.getTileCacheForProjection(projection);
    }
    const thisProj = this.getProjection(); if (!thisProj || equivalent(thisProj, projection)) {
      return this.tileCache;
    } else {
      const projKey = getUid(projection);
      if (!(projKey in this.tileCacheForProjection)) {
        this.tileCacheForProjection[projKey] = new TileCache(this.tileCache.highWaterMark);
      }
      return this.tileCacheForProjection[projKey];
    }
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @param {string} key The key set on the tile.
   * @return {!import("../Tile.js").default} Tile.
   * @private
   */
  createTile_(z, x, y, pixelRatio, projection, key) {
    const tileCoord = [z, x, y];
    const urlTileCoord = this.getTileCoordForTileUrlFunction(
      tileCoord, projection);
    const tileUrl = urlTileCoord ?
      this.tileUrlFunction(urlTileCoord, pixelRatio, projection) : undefined;
    const tile = new this.tileClass(
      tileCoord,
      tileUrl !== undefined ? TileState.IDLE : TileState.EMPTY,
      tileUrl !== undefined ? tileUrl : '',
      this.crossOrigin,
      this.tileLoadFunction,
      this.tileOptions);
    tile.key = key;
    tile.addEventListener(EventType.CHANGE, this.handleTileChange.bind(this));
    return tile;
  }

  /**
   * @inheritDoc
   */
  getTile(z, x, y, pixelRatio, projection) {
    const sourceProjection = /** @type {!import("../proj/Projection.js").default} */ (this.getProjection());
    if (!ENABLE_RASTER_REPROJECTION ||
        !sourceProjection || !projection || equivalent(sourceProjection, projection)) {
      return this.getTileInternal(z, x, y, pixelRatio, sourceProjection || projection);
    } else {
      const cache = this.getTileCacheForProjection(projection);
      const tileCoord = [z, x, y];
      let tile;
      const tileCoordKey = getKey(tileCoord);
      if (cache.containsKey(tileCoordKey)) {
        tile = /** @type {!import("../Tile.js").default} */ (cache.get(tileCoordKey));
      }
      const key = this.getKey();
      if (tile && tile.key == key) {
        return tile;
      } else {
        const sourceTileGrid = this.getTileGridForProjection(sourceProjection);
        const targetTileGrid = this.getTileGridForProjection(projection);
        const wrappedTileCoord =
            this.getTileCoordForTileUrlFunction(tileCoord, projection);
        const newTile = new ReprojTile(
          sourceProjection, sourceTileGrid,
          projection, targetTileGrid,
          tileCoord, wrappedTileCoord, this.getTilePixelRatio(pixelRatio),
          this.getGutter(),
          function(z, x, y, pixelRatio) {
            return this.getTileInternal(z, x, y, pixelRatio, sourceProjection);
          }.bind(this), this.reprojectionErrorThreshold_,
          this.renderReprojectionEdges_);
        newTile.key = key;

        if (tile) {
          newTile.interimTile = tile;
          newTile.refreshInterimChain();
          cache.replace(tileCoordKey, newTile);
        } else {
          cache.set(tileCoordKey, newTile);
        }
        return newTile;
      }
    }
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {!import("../proj/Projection.js").default} projection Projection.
   * @return {!import("../Tile.js").default} Tile.
   * @protected
   */
  getTileInternal(z, x, y, pixelRatio, projection) {
    let tile = null;
    const tileCoordKey = getKeyZXY(z, x, y);
    const key = this.getKey();
    if (!this.tileCache.containsKey(tileCoordKey)) {
      tile = this.createTile_(z, x, y, pixelRatio, projection, key);
      this.tileCache.set(tileCoordKey, tile);
    } else {
      tile = this.tileCache.get(tileCoordKey);
      if (tile.key != key) {
        // The source's params changed. If the tile has an interim tile and if we
        // can use it then we use it. Otherwise we create a new tile.  In both
        // cases we attempt to assign an interim tile to the new tile.
        const interimTile = tile;
        tile = this.createTile_(z, x, y, pixelRatio, projection, key);

        //make the new tile the head of the list,
        if (interimTile.getState() == TileState.IDLE) {
          //the old tile hasn't begun loading yet, and is now outdated, so we can simply discard it
          tile.interimTile = interimTile.interimTile;
        } else {
          tile.interimTile = interimTile;
        }
        tile.refreshInterimChain();
        this.tileCache.replace(tileCoordKey, tile);
      }
    }
    return tile;
  }

  /**
   * Sets whether to render reprojection edges or not (usually for debugging).
   * @param {boolean} render Render the edges.
   * @api
   */
  setRenderReprojectionEdges(render) {
    if (!ENABLE_RASTER_REPROJECTION ||
        this.renderReprojectionEdges_ == render) {
      return;
    }
    this.renderReprojectionEdges_ = render;
    for (const id in this.tileCacheForProjection) {
      this.tileCacheForProjection[id].clear();
    }
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
    if (ENABLE_RASTER_REPROJECTION) {
      const proj = getProjection(projection);
      if (proj) {
        const projKey = getUid(proj);
        if (!(projKey in this.tileGridForProjection)) {
          this.tileGridForProjection[projKey] = tilegrid;
        }
      }
    }
  }
}


/**
 * @param {ImageTile} imageTile Image tile.
 * @param {string} src Source.
 */
function defaultTileLoadFunction(imageTile, src) {
  /** @type {HTMLImageElement|HTMLVideoElement} */ (imageTile.getImage()).src = src;
}

export default TileImage;
