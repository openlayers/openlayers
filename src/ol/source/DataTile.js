/**
 * @module ol/source/DataTile
 */
import DataTile from '../DataTile.js';
import EventType from '../events/EventType.js';
import TileEventType from './TileEventType.js';
import TileSource, {TileSourceEvent} from './Tile.js';
import TileState from '../TileState.js';
import {assign} from '../obj.js';
import {createXYZ, extentFromProjection} from '../tilegrid.js';
import {getKeyZXY} from '../tilecoord.js';
import {getUid} from '../util.js';
import {toPromise} from '../functions.js';

/**
 * Data tile loading function.  The function is called with z, x, and y tile coordinates and
 * returns {@link import("../DataTile.js").Data data} for a tile or a promise for the same.
 * @typedef {function(number, number, number) : (import("../DataTile.js").Data|Promise<import("../DataTile.js").Data>)} Loader
 */

/**
 * @typedef {Object} Options
 * @property {Loader} [loader] Data loader.  Called with z, x, and y tile coordinates.
 * Returns {@link import("../DataTile.js").Data data} for a tile or a promise for the same.
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [maxZoom=42] Optional max zoom level. Not used if `tileGrid` is provided.
 * @property {number} [minZoom=0] Optional min zoom level. Not used if `tileGrid` is provided.
 * @property {number|import("../size.js").Size} [tileSize=[256, 256]] The pixel width and height of the tiles.
 * @property {number} [maxResolution] Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Tile projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {boolean} [opaque=false] Whether the layer is opaque.
 * @property {import("./State.js").default} [state] The source state.
 * @property {number} [tilePixelRatio] Tile pixel ratio.
 * @property {boolean} [wrapX=false] Render tiles beyond the antimeridian.
 * @property {number} [transition] Transition time when fading in new tiles (in miliseconds).
 * @property {number} [bandCount=4] Number of bands represented in the data.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 */

/**
 * @classdesc
 * A source for typed array data tiles.
 *
 * @fires import("./Tile.js").TileSourceEvent
 * @api
 */
class DataTileSource extends TileSource {
  /**
   * @param {Options} options Image tile options.
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
      opaque: options.opaque,
      state: options.state,
      tilePixelRatio: options.tilePixelRatio,
      wrapX: options.wrapX,
      transition: options.transition,
      interpolate: options.interpolate,
    });

    /**
     * @private
     * @type {!Object<string, boolean>}
     */
    this.tileLoadingKeys_ = {};

    /**
     * @private
     */
    this.loader_ = options.loader;

    this.handleTileChange_ = this.handleTileChange_.bind(this);

    /**
     * @type {number}
     */
    this.bandCount = options.bandCount === undefined ? 4 : options.bandCount; // assume RGBA if undefined
  }

  /**
   * @param {Loader} loader The data loader.
   * @protected
   */
  setLoader(loader) {
    this.loader_ = loader;
  }

  /**
   * @abstract
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @return {!DataTile} Tile.
   */
  getTile(z, x, y, pixelRatio, projection) {
    const tileCoordKey = getKeyZXY(z, x, y);
    if (this.tileCache.containsKey(tileCoordKey)) {
      return this.tileCache.get(tileCoordKey);
    }

    const sourceLoader = this.loader_;

    function loader() {
      return toPromise(function () {
        return sourceLoader(z, x, y);
      });
    }

    const tile = new DataTile(
      assign({tileCoord: [z, x, y], loader: loader}, this.tileOptions)
    );
    tile.key = this.getKey();
    tile.addEventListener(EventType.CHANGE, this.handleTileChange_);

    this.tileCache.set(tileCoordKey, tile);
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
}

export default DataTileSource;
