/**
 * @module ol/tilegrid/WMTS
 */

import {get as getProjection} from '../proj.js';
import TileGrid from './TileGrid.js';

/**
 * @typedef {Object} Options
 * @property {import("../extent.js").Extent} [extent] Extent for the tile grid. No tiles
 * outside this extent will be requested by {@link module:ol/source/Tile~TileSource} sources.
 * When no `origin` or `origins` are configured, the `origin` will be set to the
 * top-left corner of the extent.
 * @property {import("../coordinate.js").Coordinate} [origin] The tile grid origin, i.e.
 * where the `x` and `y` axes meet (`[z, 0, 0]`). Tile coordinates increase left
 * to right and downwards. If not specified, `extent` or `origins` must be provided.
 * @property {Array<import("../coordinate.js").Coordinate>} [origins] Tile grid origins,
 * i.e. where the `x` and `y` axes meet (`[z, 0, 0]`), for each zoom level. If
 * given, the array length should match the length of the `resolutions` array, i.e.
 * each resolution can have a different origin. Tile coordinates increase left to
 * right and downwards. If not specified, `extent` or `origin` must be provided.
 * @property {!Array<number>} resolutions Resolutions. The array index of each
 * resolution needs to match the zoom level. This means that even if a `minZoom`
 * is configured, the resolutions array will have a length of `maxZoom + 1`
 * @property {!Array<string>} matrixIds matrix IDs. The length of this array needs
 * to match the length of the `resolutions` array.
 * @property {Array<import("../size.js").Size>} [sizes] Number of tile rows and columns
 * of the grid for each zoom level. The values here are the `TileMatrixWidth` and
 * `TileMatrixHeight` advertised in the GetCapabilities response of the WMTS, and
 * define each zoom level's extent together with the `origin` or `origins`.
 * A grid `extent` can be configured in addition, and will further limit the extent for
 * which tile requests are made by sources. If the bottom-left corner of
 * an extent is used as `origin` or `origins`, then the `y` value must be
 * negative because OpenLayers tile coordinates use the top left as the origin.
 * @property {number|import("../size.js").Size} [tileSize] Tile size.
 * @property {Array<number|import("../size.js").Size>} [tileSizes] Tile sizes. The length of
 * this array needs to match the length of the `resolutions` array.
 */

/**
 * @classdesc
 * Set the grid pattern for sources accessing WMTS tiled-image servers.
 * @api
 */
class WMTSTileGrid extends TileGrid {
  /**
   * @param {Options} options WMTS options.
   */
  constructor(options) {
    super({
      extent: options.extent,
      origin: options.origin,
      origins: options.origins,
      resolutions: options.resolutions,
      tileSize: options.tileSize,
      tileSizes: options.tileSizes,
      sizes: options.sizes,
    });

    /**
     * @private
     * @type {!Array<string>}
     */
    this.matrixIds_ = options.matrixIds;
  }

  /**
   * @param {number} z Z.
   * @return {string} MatrixId..
   */
  getMatrixId(z) {
    return this.matrixIds_[z];
  }

  /**
   * Get the list of matrix identifiers.
   * @return {Array<string>} MatrixIds.
   * @api
   */
  getMatrixIds() {
    return this.matrixIds_;
  }
}

export default WMTSTileGrid;

/**
 * Create a tile grid from a WMTS capabilities matrix set and an
 * optional TileMatrixSetLimits.
 * @param {Object} matrixSet An object representing a matrixSet in the
 *     capabilities document.
 * @param {import("../extent.js").Extent} [extent] An optional extent to restrict the tile
 *     ranges the server provides.
 * @param {Array<Object>} [matrixLimits] An optional object representing
 *     the available matrices for tileGrid.
 * @return {WMTSTileGrid} WMTS tileGrid instance.
 * @api
 */
export function createFromCapabilitiesMatrixSet(
  matrixSet,
  extent,
  matrixLimits,
) {
  /** @type {!Array<number>} */
  const resolutions = [];
  /** @type {!Array<string>} */
  const matrixIds = [];
  /** @type {!Array<import("../coordinate.js").Coordinate>} */
  const origins = [];
  /** @type {!Array<number|import("../size.js").Size>} */
  const tileSizes = [];
  /** @type {!Array<import("../size.js").Size>} */
  const sizes = [];

  matrixLimits = matrixLimits !== undefined ? matrixLimits : [];

  const supportedCRSPropName = 'SupportedCRS';
  const matrixIdsPropName = 'TileMatrix';
  const identifierPropName = 'Identifier';
  const scaleDenominatorPropName = 'ScaleDenominator';
  const topLeftCornerPropName = 'TopLeftCorner';
  const tileWidthPropName = 'TileWidth';
  const tileHeightPropName = 'TileHeight';

  const code = matrixSet[supportedCRSPropName];
  const projection = getProjection(code);
  const metersPerUnit = projection.getMetersPerUnit();
  // swap origin x and y coordinates if axis orientation is lat/long
  const switchOriginXY = projection.getAxisOrientation().startsWith('ne');

  matrixSet[matrixIdsPropName].sort(function (a, b) {
    return b[scaleDenominatorPropName] - a[scaleDenominatorPropName];
  });

  matrixSet[matrixIdsPropName].forEach(function (elt) {
    let matrixAvailable;
    // use of matrixLimits to filter TileMatrices from GetCapabilities
    // TileMatrixSet from unavailable matrix levels.
    if (matrixLimits.length > 0) {
      matrixAvailable = matrixLimits.find(function (elt_ml) {
        if (elt[identifierPropName] == elt_ml[matrixIdsPropName]) {
          return true;
        }
        // Fallback for tileMatrix identifiers that don't get prefixed
        // by their tileMatrixSet identifiers.
        if (!elt[identifierPropName].includes(':')) {
          return (
            matrixSet[identifierPropName] + ':' + elt[identifierPropName] ===
            elt_ml[matrixIdsPropName]
          );
        }
        return false;
      });
    } else {
      matrixAvailable = true;
    }

    if (matrixAvailable) {
      matrixIds.push(elt[identifierPropName]);
      const resolution =
        (elt[scaleDenominatorPropName] * 0.28e-3) / metersPerUnit;
      const tileWidth = elt[tileWidthPropName];
      const tileHeight = elt[tileHeightPropName];
      if (switchOriginXY) {
        origins.push([
          elt[topLeftCornerPropName][1],
          elt[topLeftCornerPropName][0],
        ]);
      } else {
        origins.push(elt[topLeftCornerPropName]);
      }
      resolutions.push(resolution);
      tileSizes.push(
        tileWidth == tileHeight ? tileWidth : [tileWidth, tileHeight],
      );
      sizes.push([elt['MatrixWidth'], elt['MatrixHeight']]);
    }
  });

  return new WMTSTileGrid({
    extent: extent,
    origins: origins,
    resolutions: resolutions,
    matrixIds: matrixIds,
    tileSizes: tileSizes,
    sizes: sizes,
  });
}
