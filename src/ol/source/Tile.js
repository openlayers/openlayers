/**
 * @module ol/source/Tile
 */
import {abstract} from '../util.js';
import TileCache from '../TileCache.js';
import TileState from '../TileState.js';
import Event from '../events/Event.js';
import {equivalent} from '../proj.js';
import {toSize, scale as scaleSize} from '../size.js';
import Source from './Source.js';
import {getKeyZXY, withinExtentAndZ} from '../tilecoord.js';
import {wrapX, getForProjection as getTileGridForProjection} from '../tilegrid.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions]
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize]
 * @property {boolean} [opaque]
 * @property {number} [tilePixelRatio]
 * @property {import("../proj.js").ProjectionLike} [projection]
 * @property {import("./State.js").default} [state]
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid]
 * @property {boolean} [wrapX=true]
 * @property {number} [transition]
 * @property {string} [key]
 */


/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for sources providing images divided into a tile grid.
 * @abstract
 * @api
 */
class TileSource extends Source {
  /**
   * @param {Options} options SourceTile source options.
   */
  constructor(options) {

    super({
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      projection: options.projection,
      state: options.state,
      wrapX: options.wrapX
    });

    /**
     * @private
     * @type {boolean}
     */
    this.opaque_ = options.opaque !== undefined ? options.opaque : false;

    /**
     * @private
     * @type {number}
     */
    this.tilePixelRatio_ = options.tilePixelRatio !== undefined ?
      options.tilePixelRatio : 1;

    /**
     * @protected
     * @type {import("../tilegrid/TileGrid.js").default}
     */
    this.tileGrid = options.tileGrid !== undefined ? options.tileGrid : null;

    let cacheSize = options.cacheSize;
    if (cacheSize === undefined) {
      const tileSize = [256, 256];
      const tileGrid = options.tileGrid;
      if (tileGrid) {
        toSize(tileGrid.getTileSize(tileGrid.getMinZoom()), tileSize);
      }
      const canUseScreen = 'screen' in self;
      const width = canUseScreen ? (screen.availWidth || screen.width) : 1920;
      const height = canUseScreen ? (screen.availHeight || screen.height) : 1080;
      cacheSize = 4 * Math.ceil(width / tileSize[0]) * Math.ceil(height / tileSize[1]);
    }

    /**
     * @protected
     * @type {import("../TileCache.js").default}
     */
    this.tileCache = new TileCache(cacheSize);

    /**
     * @protected
     * @type {import("../size.js").Size}
     */
    this.tmpSize = [0, 0];

    /**
     * @private
     * @type {string}
     */
    this.key_ = options.key || '';

    /**
     * @protected
     * @type {import("../Tile.js").Options}
     */
    this.tileOptions = {transition: options.transition};

    /**
     * zDirection hint, read by the renderer. Indicates which resolution should be used
     * by a renderer if the views resolution does not match any resolution of the tile source.
     * If 0, the nearest resolution will be used. If 1, the nearest lower resolution
     * will be used. If -1, the nearest higher resolution will be used.
     * @type {number=}
     */
    this.zDirection;
  }

  /**
   * @return {boolean} Can expire cache.
   */
  canExpireCache() {
    return this.tileCache.canExpireCache();
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @param {!Object<string, import("../TileRange.js").default>} usedTiles Used tiles.
   */
  expireCache(projection, usedTiles) {
    const tileCache = this.getTileCacheForProjection(projection);
    if (tileCache) {
      tileCache.expireCache(usedTiles);
    }
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @param {number} z Zoom level.
   * @param {import("../TileRange.js").default} tileRange Tile range.
   * @param {function(import("../Tile.js").default):(boolean|void)} callback Called with each
   *     loaded tile.  If the callback returns `false`, the tile will not be
   *     considered loaded.
   * @return {boolean} The tile range is fully covered with loaded tiles.
   */
  forEachLoadedTile(projection, z, tileRange, callback) {
    const tileCache = this.getTileCacheForProjection(projection);
    if (!tileCache) {
      return false;
    }

    let covered = true;
    let tile, tileCoordKey, loaded;
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        tileCoordKey = getKeyZXY(z, x, y);
        loaded = false;
        if (tileCache.containsKey(tileCoordKey)) {
          tile = /** @type {!import("../Tile.js").default} */ (tileCache.get(tileCoordKey));
          loaded = tile.getState() === TileState.LOADED;
          if (loaded) {
            loaded = (callback(tile) !== false);
          }
        }
        if (!loaded) {
          covered = false;
        }
      }
    }
    return covered;
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {number} Gutter.
   */
  getGutterForProjection(projection) {
    return 0;
  }

  /**
   * Return the key to be used for all tiles in the source.
   * @return {string} The key for all tiles.
   * @protected
   */
  getKey() {
    return this.key_;
  }

  /**
   * Set the value to be used as the key for all tiles in the source.
   * @param {string} key The key for tiles.
   * @protected
   */
  setKey(key) {
    if (this.key_ !== key) {
      this.key_ = key;
      this.changed();
    }
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {boolean} Opaque.
   */
  getOpaque(projection) {
    return this.opaque_;
  }

  /**
   * @inheritDoc
   */
  getResolutions() {
    return this.tileGrid.getResolutions();
  }

  /**
   * @abstract
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!import("../Tile.js").default} Tile.
   */
  getTile(z, x, y, pixelRatio, projection) {
    return abstract();
  }

  /**
   * Return the tile grid of the tile source.
   * @return {import("../tilegrid/TileGrid.js").default} Tile grid.
   * @api
   */
  getTileGrid() {
    return this.tileGrid;
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!import("../tilegrid/TileGrid.js").default} Tile grid.
   */
  getTileGridForProjection(projection) {
    if (!this.tileGrid) {
      return getTileGridForProjection(projection);
    } else {
      return this.tileGrid;
    }
  }

  /**
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../TileCache.js").default} Tile cache.
   * @protected
   */
  getTileCacheForProjection(projection) {
    const thisProj = this.getProjection();
    if (thisProj && !equivalent(thisProj, projection)) {
      return null;
    } else {
      return this.tileCache;
    }
  }

  /**
   * Get the tile pixel ratio for this source. Subclasses may override this
   * method, which is meant to return a supported pixel ratio that matches the
   * provided `pixelRatio` as close as possible.
   * @param {number} pixelRatio Pixel ratio.
   * @return {number} Tile pixel ratio.
   */
  getTilePixelRatio(pixelRatio) {
    return this.tilePixelRatio_;
  }

  /**
   * @param {number} z Z.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {import("../size.js").Size} Tile size.
   */
  getTilePixelSize(z, pixelRatio, projection) {
    const tileGrid = this.getTileGridForProjection(projection);
    const tilePixelRatio = this.getTilePixelRatio(pixelRatio);
    const tileSize = toSize(tileGrid.getTileSize(z), this.tmpSize);
    if (tilePixelRatio == 1) {
      return tileSize;
    } else {
      return scaleSize(tileSize, tilePixelRatio, this.tmpSize);
    }
  }

  /**
   * Returns a tile coordinate wrapped around the x-axis. When the tile coordinate
   * is outside the resolution and extent range of the tile grid, `null` will be
   * returned.
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../proj/Projection.js").default=} opt_projection Projection.
   * @return {import("../tilecoord.js").TileCoord} Tile coordinate to be passed to the tileUrlFunction or
   *     null if no tile URL should be created for the passed `tileCoord`.
   */
  getTileCoordForTileUrlFunction(tileCoord, opt_projection) {
    const projection = opt_projection !== undefined ?
      opt_projection : this.getProjection();
    const tileGrid = this.getTileGridForProjection(projection);
    if (this.getWrapX() && projection.isGlobal()) {
      tileCoord = wrapX(tileGrid, tileCoord, projection);
    }
    return withinExtentAndZ(tileCoord, tileGrid) ? tileCoord : null;
  }

  /**
   * Remove all cached tiles from the source. The next render cycle will fetch new tiles.
   * @api
   */
  clear() {
    this.tileCache.clear();
  }

  /**
   * @inheritDoc
   */
  refresh() {
    this.clear();
    super.refresh();
  }

  /**
   * Marks a tile coord as being used, without triggering a load.
   * @abstract
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {import("../proj/Projection.js").default} projection Projection.
   */
  useTile(z, x, y, projection) {}

}


/**
 * @classdesc
 * Events emitted by {@link module:ol/source/Tile~TileSource} instances are instances of this
 * type.
 */
export class TileSourceEvent extends Event {
  /**
   * @param {string} type Type.
   * @param {import("../Tile.js").default} tile The tile.
   */
  constructor(type, tile) {

    super(type);

    /**
     * The tile related to the event.
     * @type {import("../Tile.js").default}
     * @api
     */
    this.tile = tile;

  }

}

export default TileSource;
