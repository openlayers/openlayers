/**
 * @module ol/tilegrid/TileGrid
 */
import {DEFAULT_TILE_SIZE} from './common.js';
import {assert} from '../asserts.js';
import TileRange, {createOrUpdate as createOrUpdateTileRange} from '../TileRange.js';
import {isSorted, linearFindNearest} from '../array.js';
import {createOrUpdate, getTopLeft} from '../extent.js';
import {clamp} from '../math.js';
import {toSize} from '../size.js';
import {createOrUpdate as createOrUpdateTileCoord} from '../tilecoord.js';


/**
 * @private
 * @type {import("../tilecoord.js").TileCoord}
 */
const tmpTileCoord = [0, 0, 0];


/**
 * @typedef {Object} Options
 * @property {import("../extent.js").Extent} [extent] Extent for the tile grid. No tiles outside this
 * extent will be requested by {@link module:ol/source/Tile} sources. When no `origin` or
 * `origins` are configured, the `origin` will be set to the top-left corner of the extent.
 * @property {number} [minZoom=0] Minimum zoom.
 * @property {import("../coordinate.js").Coordinate} [origin] The tile grid origin, i.e. where the `x`
 * and `y` axes meet (`[z, 0, 0]`). Tile coordinates increase left to right and downwards. If not
 * specified, `extent` or `origins` must be provided.
 * @property {Array<import("../coordinate.js").Coordinate>} [origins] Tile grid origins, i.e. where
 * the `x` and `y` axes meet (`[z, 0, 0]`), for each zoom level. If given, the array length
 * should match the length of the `resolutions` array, i.e. each resolution can have a different
 * origin. Tile coordinates increase left to right and downwards. If not specified, `extent` or
 * `origin` must be provided.
 * @property {!Array<number>} resolutions Resolutions. The array index of each resolution needs
 * to match the zoom level. This means that even if a `minZoom` is configured, the resolutions
 * array will have a length of `maxZoom + 1`.
 * @property {Array<import("../size.js").Size>} [sizes] Number of tile rows and columns
 * of the grid for each zoom level. If specified the values
 * define each zoom level's extent together with the `origin` or `origins`.
 * A grid `extent` can be configured in addition, and will further limit the extent
 * for which tile requests are made by sources. If the bottom-left corner of
 * an extent is used as `origin` or `origins`, then the `y` value must be
 * negative because OpenLayers tile coordinates use the top left as the origin.
 * @property {number|import("../size.js").Size} [tileSize] Tile size.
 * Default is `[256, 256]`.
 * @property {Array<import("../size.js").Size>} [tileSizes] Tile sizes. If given, the array length
 * should match the length of the `resolutions` array, i.e. each resolution can have a different
 * tile size.
 */


/**
 * @classdesc
 * Base class for setting the grid pattern for sources accessing tiled-image
 * servers.
 * @api
 */
class TileGrid {
  /**
   * @param {Options} options Tile grid options.
   */
  constructor(options) {

    /**
     * @protected
     * @type {number}
     */
    this.minZoom = options.minZoom !== undefined ? options.minZoom : 0;

    /**
     * @private
     * @type {!Array<number>}
     */
    this.resolutions_ = options.resolutions;
    assert(isSorted(this.resolutions_, function(a, b) {
      return b - a;
    }, true), 17); // `resolutions` must be sorted in descending order


    // check if we've got a consistent zoom factor and origin
    let zoomFactor;
    if (!options.origins) {
      for (let i = 0, ii = this.resolutions_.length - 1; i < ii; ++i) {
        if (!zoomFactor) {
          zoomFactor = this.resolutions_[i] / this.resolutions_[i + 1];
        } else {
          if (this.resolutions_[i] / this.resolutions_[i + 1] !== zoomFactor) {
            zoomFactor = undefined;
            break;
          }
        }
      }
    }


    /**
     * @private
     * @type {number|undefined}
     */
    this.zoomFactor_ = zoomFactor;


    /**
     * @protected
     * @type {number}
     */
    this.maxZoom = this.resolutions_.length - 1;

    /**
     * @private
     * @type {import("../coordinate.js").Coordinate}
     */
    this.origin_ = options.origin !== undefined ? options.origin : null;

    /**
     * @private
     * @type {Array<import("../coordinate.js").Coordinate>}
     */
    this.origins_ = null;
    if (options.origins !== undefined) {
      this.origins_ = options.origins;
      assert(this.origins_.length == this.resolutions_.length,
        20); // Number of `origins` and `resolutions` must be equal
    }

    const extent = options.extent;

    if (extent !== undefined &&
        !this.origin_ && !this.origins_) {
      this.origin_ = getTopLeft(extent);
    }

    assert(
      (!this.origin_ && this.origins_) || (this.origin_ && !this.origins_),
      18); // Either `origin` or `origins` must be configured, never both

    /**
     * @private
     * @type {Array<number|import("../size.js").Size>}
     */
    this.tileSizes_ = null;
    if (options.tileSizes !== undefined) {
      this.tileSizes_ = options.tileSizes;
      assert(this.tileSizes_.length == this.resolutions_.length,
        19); // Number of `tileSizes` and `resolutions` must be equal
    }

    /**
     * @private
     * @type {number|import("../size.js").Size}
     */
    this.tileSize_ = options.tileSize !== undefined ?
      options.tileSize :
      !this.tileSizes_ ? DEFAULT_TILE_SIZE : null;
    assert(
      (!this.tileSize_ && this.tileSizes_) ||
        (this.tileSize_ && !this.tileSizes_),
      22); // Either `tileSize` or `tileSizes` must be configured, never both

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.extent_ = extent !== undefined ? extent : null;


    /**
     * @private
     * @type {Array<import("../TileRange.js").default>}
     */
    this.fullTileRanges_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.tmpSize_ = [0, 0];

    if (options.sizes !== undefined) {
      this.fullTileRanges_ = options.sizes.map(function(size, z) {
        const tileRange = new TileRange(
          Math.min(0, size[0]), Math.max(size[0] - 1, -1),
          Math.min(0, size[1]), Math.max(size[1] - 1, -1));
        return tileRange;
      }, this);
    } else if (extent) {
      this.calculateTileRanges_(extent);
    }

  }

  /**
   * Call a function with each tile coordinate for a given extent and zoom level.
   *
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} zoom Integer zoom level.
   * @param {function(import("../tilecoord.js").TileCoord): void} callback Function called with each tile coordinate.
   * @api
   */
  forEachTileCoord(extent, zoom, callback) {
    const tileRange = this.getTileRangeForExtentAndZ(extent, zoom);
    for (let i = tileRange.minX, ii = tileRange.maxX; i <= ii; ++i) {
      for (let j = tileRange.minY, jj = tileRange.maxY; j <= jj; ++j) {
        callback([zoom, i, j]);
      }
    }
  }

  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {function(number, import("../TileRange.js").default): boolean} callback Callback.
   * @param {import("../TileRange.js").default=} opt_tileRange Temporary import("../TileRange.js").default object.
   * @param {import("../extent.js").Extent=} opt_extent Temporary import("../extent.js").Extent object.
   * @return {boolean} Callback succeeded.
   */
  forEachTileCoordParentTileRange(tileCoord, callback, opt_tileRange, opt_extent) {
    let tileRange, x, y;
    let tileCoordExtent = null;
    let z = tileCoord[0] - 1;
    if (this.zoomFactor_ === 2) {
      x = tileCoord[1];
      y = tileCoord[2];
    } else {
      tileCoordExtent = this.getTileCoordExtent(tileCoord, opt_extent);
    }
    while (z >= this.minZoom) {
      if (this.zoomFactor_ === 2) {
        x = Math.floor(x / 2);
        y = Math.floor(y / 2);
        tileRange = createOrUpdateTileRange(x, x, y, y, opt_tileRange);
      } else {
        tileRange = this.getTileRangeForExtentAndZ(tileCoordExtent, z, opt_tileRange);
      }
      if (callback(z, tileRange)) {
        return true;
      }
      --z;
    }
    return false;
  }

  /**
   * Get the extent for this tile grid, if it was configured.
   * @return {import("../extent.js").Extent} Extent.
   * @api
   */
  getExtent() {
    return this.extent_;
  }

  /**
   * Get the maximum zoom level for the grid.
   * @return {number} Max zoom.
   * @api
   */
  getMaxZoom() {
    return this.maxZoom;
  }

  /**
   * Get the minimum zoom level for the grid.
   * @return {number} Min zoom.
   * @api
   */
  getMinZoom() {
    return this.minZoom;
  }

  /**
   * Get the origin for the grid at the given zoom level.
   * @param {number} z Integer zoom level.
   * @return {import("../coordinate.js").Coordinate} Origin.
   * @api
   */
  getOrigin(z) {
    if (this.origin_) {
      return this.origin_;
    } else {
      return this.origins_[z];
    }
  }

  /**
   * Get the resolution for the given zoom level.
   * @param {number} z Integer zoom level.
   * @return {number} Resolution.
   * @api
   */
  getResolution(z) {
    return this.resolutions_[z];
  }

  /**
   * Get the list of resolutions for the tile grid.
   * @return {Array<number>} Resolutions.
   * @api
   */
  getResolutions() {
    return this.resolutions_;
  }

  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../TileRange.js").default=} opt_tileRange Temporary import("../TileRange.js").default object.
   * @param {import("../extent.js").Extent=} opt_extent Temporary import("../extent.js").Extent object.
   * @return {import("../TileRange.js").default} Tile range.
   */
  getTileCoordChildTileRange(tileCoord, opt_tileRange, opt_extent) {
    if (tileCoord[0] < this.maxZoom) {
      if (this.zoomFactor_ === 2) {
        const minX = tileCoord[1] * 2;
        const minY = tileCoord[2] * 2;
        return createOrUpdateTileRange(minX, minX + 1, minY, minY + 1, opt_tileRange);
      }
      const tileCoordExtent = this.getTileCoordExtent(tileCoord, opt_extent);
      return this.getTileRangeForExtentAndZ(
        tileCoordExtent, tileCoord[0] + 1, opt_tileRange);
    }
    return null;
  }

  /**
   * Get the extent for a tile range.
   * @param {number} z Integer zoom level.
   * @param {import("../TileRange.js").default} tileRange Tile range.
   * @param {import("../extent.js").Extent=} opt_extent Temporary import("../extent.js").Extent object.
   * @return {import("../extent.js").Extent} Extent.
   */
  getTileRangeExtent(z, tileRange, opt_extent) {
    const origin = this.getOrigin(z);
    const resolution = this.getResolution(z);
    const tileSize = toSize(this.getTileSize(z), this.tmpSize_);
    const minX = origin[0] + tileRange.minX * tileSize[0] * resolution;
    const maxX = origin[0] + (tileRange.maxX + 1) * tileSize[0] * resolution;
    const minY = origin[1] + tileRange.minY * tileSize[1] * resolution;
    const maxY = origin[1] + (tileRange.maxY + 1) * tileSize[1] * resolution;
    return createOrUpdate(minX, minY, maxX, maxY, opt_extent);
  }

  /**
   * Get a tile range for the given extent and integer zoom level.
   * @param {import("../extent.js").Extent} extent Extent.
   * @param {number} z Integer zoom level.
   * @param {import("../TileRange.js").default=} opt_tileRange Temporary tile range object.
   * @return {import("../TileRange.js").default} Tile range.
   */
  getTileRangeForExtentAndZ(extent, z, opt_tileRange) {
    const tileCoord = tmpTileCoord;
    this.getTileCoordForXYAndZ_(extent[0], extent[3], z, false, tileCoord);
    const minX = tileCoord[1];
    const minY = tileCoord[2];
    this.getTileCoordForXYAndZ_(extent[2], extent[1], z, true, tileCoord);
    return createOrUpdateTileRange(minX, tileCoord[1], minY, tileCoord[2], opt_tileRange);
  }

  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @return {import("../coordinate.js").Coordinate} Tile center.
   */
  getTileCoordCenter(tileCoord) {
    const origin = this.getOrigin(tileCoord[0]);
    const resolution = this.getResolution(tileCoord[0]);
    const tileSize = toSize(this.getTileSize(tileCoord[0]), this.tmpSize_);
    return [
      origin[0] + (tileCoord[1] + 0.5) * tileSize[0] * resolution,
      origin[1] - (tileCoord[2] + 0.5) * tileSize[1] * resolution
    ];
  }

  /**
   * Get the extent of a tile coordinate.
   *
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../extent.js").Extent=} opt_extent Temporary extent object.
   * @return {import("../extent.js").Extent} Extent.
   * @api
   */
  getTileCoordExtent(tileCoord, opt_extent) {
    const origin = this.getOrigin(tileCoord[0]);
    const resolution = this.getResolution(tileCoord[0]);
    const tileSize = toSize(this.getTileSize(tileCoord[0]), this.tmpSize_);
    const minX = origin[0] + tileCoord[1] * tileSize[0] * resolution;
    const minY = origin[1] - (tileCoord[2] + 1) * tileSize[1] * resolution;
    const maxX = minX + tileSize[0] * resolution;
    const maxY = minY + tileSize[1] * resolution;
    return createOrUpdate(minX, minY, maxX, maxY, opt_extent);
  }

  /**
   * Get the tile coordinate for the given map coordinate and resolution.  This
   * method considers that coordinates that intersect tile boundaries should be
   * assigned the higher tile coordinate.
   *
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {number} resolution Resolution.
   * @param {import("../tilecoord.js").TileCoord=} opt_tileCoord Destination import("../tilecoord.js").TileCoord object.
   * @return {import("../tilecoord.js").TileCoord} Tile coordinate.
   * @api
   */
  getTileCoordForCoordAndResolution(coordinate, resolution, opt_tileCoord) {
    return this.getTileCoordForXYAndResolution_(
      coordinate[0], coordinate[1], resolution, false, opt_tileCoord);
  }

  /**
   * Note that this method should not be called for resolutions that correspond
   * to an integer zoom level.  Instead call the `getTileCoordForXYAndZ_` method.
   * @param {number} x X.
   * @param {number} y Y.
   * @param {number} resolution Resolution (for a non-integer zoom level).
   * @param {boolean} reverseIntersectionPolicy Instead of letting edge
   *     intersections go to the higher tile coordinate, let edge intersections
   *     go to the lower tile coordinate.
   * @param {import("../tilecoord.js").TileCoord=} opt_tileCoord Temporary import("../tilecoord.js").TileCoord object.
   * @return {import("../tilecoord.js").TileCoord} Tile coordinate.
   * @private
   */
  getTileCoordForXYAndResolution_(x, y, resolution, reverseIntersectionPolicy, opt_tileCoord) {
    const z = this.getZForResolution(resolution);
    const scale = resolution / this.getResolution(z);
    const origin = this.getOrigin(z);
    const tileSize = toSize(this.getTileSize(z), this.tmpSize_);

    const adjustX = reverseIntersectionPolicy ? 0.5 : 0;
    const adjustY = reverseIntersectionPolicy ? 0.5 : 0;
    const xFromOrigin = Math.floor((x - origin[0]) / resolution + adjustX);
    const yFromOrigin = Math.floor((origin[1] - y) / resolution + adjustY);
    let tileCoordX = scale * xFromOrigin / tileSize[0];
    let tileCoordY = scale * yFromOrigin / tileSize[1];

    if (reverseIntersectionPolicy) {
      tileCoordX = Math.ceil(tileCoordX) - 1;
      tileCoordY = Math.ceil(tileCoordY) - 1;
    } else {
      tileCoordX = Math.floor(tileCoordX);
      tileCoordY = Math.floor(tileCoordY);
    }

    return createOrUpdateTileCoord(z, tileCoordX, tileCoordY, opt_tileCoord);
  }

  /**
   * Although there is repetition between this method and `getTileCoordForXYAndResolution_`,
   * they should have separate implementations.  This method is for integer zoom
   * levels.  The other method should only be called for resolutions corresponding
   * to non-integer zoom levels.
   * @param {number} x Map x coordinate.
   * @param {number} y Map y coordinate.
   * @param {number} z Integer zoom level.
   * @param {boolean} reverseIntersectionPolicy Instead of letting edge
   *     intersections go to the higher tile coordinate, let edge intersections
   *     go to the lower tile coordinate.
   * @param {import("../tilecoord.js").TileCoord=} opt_tileCoord Temporary import("../tilecoord.js").TileCoord object.
   * @return {import("../tilecoord.js").TileCoord} Tile coordinate.
   * @private
   */
  getTileCoordForXYAndZ_(x, y, z, reverseIntersectionPolicy, opt_tileCoord) {
    const origin = this.getOrigin(z);
    const resolution = this.getResolution(z);
    const tileSize = toSize(this.getTileSize(z), this.tmpSize_);

    const adjustX = reverseIntersectionPolicy ? 0.5 : 0;
    const adjustY = reverseIntersectionPolicy ? 0.5 : 0;
    const xFromOrigin = Math.floor((x - origin[0]) / resolution + adjustX);
    const yFromOrigin = Math.floor((origin[1] - y) / resolution + adjustY);
    let tileCoordX = xFromOrigin / tileSize[0];
    let tileCoordY = yFromOrigin / tileSize[1];

    if (reverseIntersectionPolicy) {
      tileCoordX = Math.ceil(tileCoordX) - 1;
      tileCoordY = Math.ceil(tileCoordY) - 1;
    } else {
      tileCoordX = Math.floor(tileCoordX);
      tileCoordY = Math.floor(tileCoordY);
    }

    return createOrUpdateTileCoord(z, tileCoordX, tileCoordY, opt_tileCoord);
  }

  /**
   * Get a tile coordinate given a map coordinate and zoom level.
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {number} z Zoom level.
   * @param {import("../tilecoord.js").TileCoord=} opt_tileCoord Destination import("../tilecoord.js").TileCoord object.
   * @return {import("../tilecoord.js").TileCoord} Tile coordinate.
   * @api
   */
  getTileCoordForCoordAndZ(coordinate, z, opt_tileCoord) {
    return this.getTileCoordForXYAndZ_(
      coordinate[0], coordinate[1], z, false, opt_tileCoord);
  }

  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @return {number} Tile resolution.
   */
  getTileCoordResolution(tileCoord) {
    return this.resolutions_[tileCoord[0]];
  }

  /**
   * Get the tile size for a zoom level. The type of the return value matches the
   * `tileSize` or `tileSizes` that the tile grid was configured with. To always
   * get an `import("../size.js").Size`, run the result through `import("../size.js").Size.toSize()`.
   * @param {number} z Z.
   * @return {number|import("../size.js").Size} Tile size.
   * @api
   */
  getTileSize(z) {
    if (this.tileSize_) {
      return this.tileSize_;
    } else {
      return this.tileSizes_[z];
    }
  }

  /**
   * @param {number} z Zoom level.
   * @return {import("../TileRange.js").default} Extent tile range for the specified zoom level.
   */
  getFullTileRange(z) {
    if (!this.fullTileRanges_) {
      return null;
    } else {
      return this.fullTileRanges_[z];
    }
  }

  /**
   * @param {number} resolution Resolution.
   * @param {number=} opt_direction If 0, the nearest resolution will be used.
   *     If 1, the nearest lower resolution will be used. If -1, the nearest
   *     higher resolution will be used. Default is 0.
   * @return {number} Z.
   * @api
   */
  getZForResolution(resolution, opt_direction) {
    const z = linearFindNearest(this.resolutions_, resolution, opt_direction || 0);
    return clamp(z, this.minZoom, this.maxZoom);
  }

  /**
   * @param {!import("../extent.js").Extent} extent Extent for this tile grid.
   * @private
   */
  calculateTileRanges_(extent) {
    const length = this.resolutions_.length;
    const fullTileRanges = new Array(length);
    for (let z = this.minZoom; z < length; ++z) {
      fullTileRanges[z] = this.getTileRangeForExtentAndZ(extent, z);
    }
    this.fullTileRanges_ = fullTileRanges;
  }
}


export default TileGrid;
