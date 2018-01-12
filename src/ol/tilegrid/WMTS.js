/**
 * @module ol/tilegrid/WMTS
 */
import {inherits} from '../index.js';
import {find} from '../array.js';
import {get as getProjection} from '../proj.js';
import TileGrid from '../tilegrid/TileGrid.js';

/**
 * @classdesc
 * Set the grid pattern for sources accessing WMTS tiled-image servers.
 *
 * @constructor
 * @extends {ol.tilegrid.TileGrid}
 * @param {olx.tilegrid.WMTSOptions} options WMTS options.
 * @struct
 * @api
 */
const WMTSTileGrid = function(options) {
  /**
   * @private
   * @type {!Array.<string>}
   */
  this.matrixIds_ = options.matrixIds;
  // FIXME: should the matrixIds become optional?

  TileGrid.call(this, {
    extent: options.extent,
    origin: options.origin,
    origins: options.origins,
    resolutions: options.resolutions,
    tileSize: options.tileSize,
    tileSizes: options.tileSizes,
    sizes: options.sizes
  });
};

inherits(WMTSTileGrid, TileGrid);


/**
 * @param {number} z Z.
 * @return {string} MatrixId..
 */
WMTSTileGrid.prototype.getMatrixId = function(z) {
  return this.matrixIds_[z];
};


/**
 * Get the list of matrix identifiers.
 * @return {Array.<string>} MatrixIds.
 * @api
 */
WMTSTileGrid.prototype.getMatrixIds = function() {
  return this.matrixIds_;
};

export default WMTSTileGrid;

/**
 * Create a tile grid from a WMTS capabilities matrix set and an
 * optional TileMatrixSetLimits.
 * @param {Object} matrixSet An object representing a matrixSet in the
 *     capabilities document.
 * @param {ol.Extent=} opt_extent An optional extent to restrict the tile
 *     ranges the server provides.
 * @param {Array.<Object>=} opt_matrixLimits An optional object representing
 *     the available matrices for tileGrid.
 * @return {ol.tilegrid.WMTS} WMTS tileGrid instance.
 * @api
 */
export function createFromCapabilitiesMatrixSet(matrixSet, opt_extent, opt_matrixLimits) {

  /** @type {!Array.<number>} */
  const resolutions = [];
  /** @type {!Array.<string>} */
  const matrixIds = [];
  /** @type {!Array.<ol.Coordinate>} */
  const origins = [];
  /** @type {!Array.<ol.Size>} */
  const tileSizes = [];
  /** @type {!Array.<ol.Size>} */
  const sizes = [];

  const matrixLimits = opt_matrixLimits !== undefined ? opt_matrixLimits : [];

  const supportedCRSPropName = 'SupportedCRS';
  const matrixIdsPropName = 'TileMatrix';
  const identifierPropName = 'Identifier';
  const scaleDenominatorPropName = 'ScaleDenominator';
  const topLeftCornerPropName = 'TopLeftCorner';
  const tileWidthPropName = 'TileWidth';
  const tileHeightPropName = 'TileHeight';

  const code = matrixSet[supportedCRSPropName];
  const projection = getProjection(code.replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3')) ||
      getProjection(code);
  const metersPerUnit = projection.getMetersPerUnit();
  // swap origin x and y coordinates if axis orientation is lat/long
  const switchOriginXY = projection.getAxisOrientation().substr(0, 2) == 'ne';

  matrixSet[matrixIdsPropName].sort(function(a, b) {
    return b[scaleDenominatorPropName] - a[scaleDenominatorPropName];
  });

  matrixSet[matrixIdsPropName].forEach(function(elt, index, array) {

    let matrixAvailable;
    // use of matrixLimits to filter TileMatrices from GetCapabilities
    // TileMatrixSet from unavailable matrix levels.
    if (matrixLimits.length > 0) {
      matrixAvailable = find(matrixLimits,
        function(elt_ml, index_ml, array_ml) {
          return elt[identifierPropName] == elt_ml[matrixIdsPropName];
        });
    } else {
      matrixAvailable = true;
    }

    if (matrixAvailable) {
      matrixIds.push(elt[identifierPropName]);
      const resolution = elt[scaleDenominatorPropName] * 0.28E-3 / metersPerUnit;
      const tileWidth = elt[tileWidthPropName];
      const tileHeight = elt[tileHeightPropName];
      if (switchOriginXY) {
        origins.push([elt[topLeftCornerPropName][1],
          elt[topLeftCornerPropName][0]]);
      } else {
        origins.push(elt[topLeftCornerPropName]);
      }
      resolutions.push(resolution);
      tileSizes.push(tileWidth == tileHeight ?
        tileWidth : [tileWidth, tileHeight]);
      // top-left origin, so height is negative
      sizes.push([elt['MatrixWidth'], -elt['MatrixHeight']]);
    }
  });

  return new WMTSTileGrid({
    extent: opt_extent,
    origins: origins,
    resolutions: resolutions,
    matrixIds: matrixIds,
    tileSizes: tileSizes,
    sizes: sizes
  });
}
