/**
 * @module ol/source/Tile
 */
import Event from '../events/Event.js';
import Source from './Source.js';
import {abstract, getUid} from '../util.js';
import {
  getForProjection as getTileGridForProjection,
  wrapX,
} from '../tilegrid.js';
import {scale as scaleSize, toSize} from '../size.js';
import {withinExtentAndZ} from '../tilecoord.js';

/***
 * @template Return
 * @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
 *   import("../Observable").OnSignature<import("../ObjectEventType").Types, import("../Object").ObjectEvent, Return> &
 *   import("../Observable").OnSignature<import("./TileEventType").TileSourceEventTypes, TileSourceEvent, Return> &
 *   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
 *     import("./TileEventType").TileSourceEventTypes, Return>} TileSourceOnSignature
 */

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Deprecated.  Use the cacheSize option on the layer instead.
 * @property {number} [tilePixelRatio] TilePixelRatio.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection.
 * @property {import("./Source.js").State} [state] State.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] TileGrid.
 * @property {boolean} [wrapX=false] WrapX.
 * @property {number} [transition] Transition.
 * @property {string} [key] Key.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0] ZDirection.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 */

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for sources providing images divided into a tile grid.
 *
 * @template {import("../Tile.js").default} [TileType=import("../Tile.js").default]
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
      wrapX: options.wrapX,
      interpolate: options.interpolate,
    });

    /***
     * @type {TileSourceOnSignature<import("../events").EventsKey>}
     */
    this.on;

    /***
     * @type {TileSourceOnSignature<import("../events").EventsKey>}
     */
    this.once;

    /***
     * @type {TileSourceOnSignature<void>}
     */
    this.un;

    /**
     * @private
     * @type {number}
     */
    this.tilePixelRatio_ =
      options.tilePixelRatio !== undefined ? options.tilePixelRatio : 1;

    /**
     * @type {import("../tilegrid/TileGrid.js").default|null}
     * @protected
     */
    this.tileGrid = options.tileGrid !== undefined ? options.tileGrid : null;

    const tileSize = [256, 256];
    if (this.tileGrid) {
      toSize(this.tileGrid.getTileSize(this.tileGrid.getMinZoom()), tileSize);
    }

    /**
     * @protected
     * @type {import("../size.js").Size}
     */
    this.tmpSize = [0, 0];

    /**
     * @private
     * @type {string}
     */
    this.key_ = options.key || getUid(this);

    /**
     * @protected
     * @type {import("../Tile.js").Options}
     */
    this.tileOptions = {
      transition: options.transition,
      interpolate: options.interpolate,
    };

    /**
     * zDirection hint, read by the renderer. Indicates which resolution should be used
     * by a renderer if the views resolution does not match any resolution of the tile source.
     * If 0, the nearest resolution will be used. If 1, the nearest lower resolution
     * will be used. If -1, the nearest higher resolution will be used.
     * @type {number|import("../array.js").NearestDirectionFunction}
     */
    this.zDirection = options.zDirection ? options.zDirection : 0;
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
   * @param {import("../proj/Projection").default} [projection] Projection.
   * @return {Array<number>|null} Resolutions.
   * @override
   */
  getResolutions(projection) {
    const tileGrid = projection
      ? this.getTileGridForProjection(projection)
      : this.tileGrid;
    if (!tileGrid) {
      return null;
    }
    return tileGrid.getResolutions();
  }

  /**
   * @abstract
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {TileType|null} Tile.
   */
  getTile(z, x, y, pixelRatio, projection) {
    return abstract();
  }

  /**
   * Return the tile grid of the tile source.
   * @return {import("../tilegrid/TileGrid.js").default|null} Tile grid.
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
    }
    return this.tileGrid;
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
    }
    return scaleSize(tileSize, tilePixelRatio, this.tmpSize);
  }

  /**
   * Returns a tile coordinate wrapped around the x-axis. When the tile coordinate
   * is outside the resolution and extent range of the tile grid, `null` will be
   * returned.
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../proj/Projection.js").default} [projection] Projection.
   * @return {import("../tilecoord.js").TileCoord} Tile coordinate to be passed to the tileUrlFunction or
   *     null if no tile URL should be created for the passed `tileCoord`.
   */
  getTileCoordForTileUrlFunction(tileCoord, projection) {
    const gridProjection =
      projection !== undefined ? projection : this.getProjection();
    const tileGrid =
      projection !== undefined
        ? this.getTileGridForProjection(gridProjection)
        : this.tileGrid || this.getTileGridForProjection(gridProjection);
    if (this.getWrapX() && gridProjection.isGlobal()) {
      tileCoord = wrapX(tileGrid, tileCoord, gridProjection);
    }
    return withinExtentAndZ(tileCoord, tileGrid) ? tileCoord : null;
  }

  /**
   * Remove all cached reprojected tiles from the source. The next render cycle will create new tiles.
   * @api
   */
  clear() {}

  /**
   * @override
   */
  refresh() {
    this.clear();
    super.refresh();
  }
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
