import _ol_ from '../index';
import _ol_array_ from '../array';
import _ol_proj_ from '../proj';
import _ol_tilegrid_TileGrid_ from '../tilegrid/tilegrid';

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
var _ol_tilegrid_WMTS_ = function(options) {
  /**
   * @private
   * @type {!Array.<string>}
   */
  this.matrixIds_ = options.matrixIds;
  // FIXME: should the matrixIds become optional?

  _ol_tilegrid_TileGrid_.call(this, {
    extent: options.extent,
    origin: options.origin,
    origins: options.origins,
    resolutions: options.resolutions,
    tileSize: options.tileSize,
    tileSizes: options.tileSizes,
    sizes: options.sizes
  });
};

_ol_.inherits(_ol_tilegrid_WMTS_, _ol_tilegrid_TileGrid_);


/**
 * @param {number} z Z.
 * @return {string} MatrixId..
 */
_ol_tilegrid_WMTS_.prototype.getMatrixId = function(z) {
  return this.matrixIds_[z];
};


/**
 * Get the list of matrix identifiers.
 * @return {Array.<string>} MatrixIds.
 * @api
 */
_ol_tilegrid_WMTS_.prototype.getMatrixIds = function() {
  return this.matrixIds_;
};


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
_ol_tilegrid_WMTS_.createFromCapabilitiesMatrixSet = function(matrixSet, opt_extent,
    opt_matrixLimits) {

  /** @type {!Array.<number>} */
  var resolutions = [];
  /** @type {!Array.<string>} */
  var matrixIds = [];
  /** @type {!Array.<ol.Coordinate>} */
  var origins = [];
  /** @type {!Array.<ol.Size>} */
  var tileSizes = [];
  /** @type {!Array.<ol.Size>} */
  var sizes = [];

  var matrixLimits = opt_matrixLimits !== undefined ? opt_matrixLimits : [];

  var supportedCRSPropName = 'SupportedCRS';
  var matrixIdsPropName = 'TileMatrix';
  var identifierPropName = 'Identifier';
  var scaleDenominatorPropName = 'ScaleDenominator';
  var topLeftCornerPropName = 'TopLeftCorner';
  var tileWidthPropName = 'TileWidth';
  var tileHeightPropName = 'TileHeight';

  var projection;
  projection = _ol_proj_.get(matrixSet[supportedCRSPropName].replace(
      /urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'));
  var metersPerUnit = projection.getMetersPerUnit();
  // swap origin x and y coordinates if axis orientation is lat/long
  var switchOriginXY = projection.getAxisOrientation().substr(0, 2) == 'ne';

  matrixSet[matrixIdsPropName].sort(function(a, b) {
    return b[scaleDenominatorPropName] - a[scaleDenominatorPropName];
  });

  matrixSet[matrixIdsPropName].forEach(function(elt, index, array) {

    var matrixAvailable;
    // use of matrixLimits to filter TileMatrices from GetCapabilities
    // TileMatrixSet from unavailable matrix levels.
    if (matrixLimits.length > 0) {
      matrixAvailable = _ol_array_.find(matrixLimits,
          function(elt_ml, index_ml, array_ml) {
            return elt[identifierPropName] == elt_ml[matrixIdsPropName];
          });
    } else {
      matrixAvailable = true;
    }

    if (matrixAvailable) {
      matrixIds.push(elt[identifierPropName]);
      var resolution = elt[scaleDenominatorPropName] * 0.28E-3 / metersPerUnit;
      var tileWidth = elt[tileWidthPropName];
      var tileHeight = elt[tileHeightPropName];
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

  return new _ol_tilegrid_WMTS_({
    extent: opt_extent,
    origins: origins,
    resolutions: resolutions,
    matrixIds: matrixIds,
    tileSizes: tileSizes,
    sizes: sizes
  });
};
export default _ol_tilegrid_WMTS_;
