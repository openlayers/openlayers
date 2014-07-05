goog.provide('ol.tilegrid.WMTS');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('ol.proj');
goog.require('ol.tilegrid.TileGrid');



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
ol.tilegrid.WMTS = function(options) {

  goog.asserts.assert(
      options.resolutions.length == options.matrixIds.length);

  /**
   * @private
   * @type {!Array.<string>}
   */
  this.matrixIds_ = options.matrixIds;
  // FIXME: should the matrixIds become optionnal?

  goog.base(this, {
    origin: options.origin,
    origins: options.origins,
    resolutions: options.resolutions,
    tileSize: options.tileSize,
    tileSizes: options.tileSizes
  });

};
goog.inherits(ol.tilegrid.WMTS, ol.tilegrid.TileGrid);


/**
 * @param {number} z Z.
 * @return {string} MatrixId..
 */
ol.tilegrid.WMTS.prototype.getMatrixId = function(z) {
  goog.asserts.assert(0 <= z && z < this.matrixIds_.length);
  return this.matrixIds_[z];
};


/**
 * @return {Array.<string>} MatrixIds.
 * @api
 */
ol.tilegrid.WMTS.prototype.getMatrixIds = function() {
  return this.matrixIds_;
};


/**
 * @param {Object} matrixSet An object representing a matrixSet in the
 *     capabilities document.
 * @return {ol.tilegrid.WMTS} WMTS tileGrid instance.
 */
ol.tilegrid.WMTS.createFromCapabilitiesMatrixSet =
    function(matrixSet) {

  /** @type {!Array.<number>} */
  var resolutions = [];
  /** @type {!Array.<string>} */
  var matrixIds = [];
  /** @type {!Array.<ol.Coordinate>} */
  var origins = [];
  /** @type {!Array.<number>} */
  var tileSizes = [];

  var supportedCRSPropName = 'supportedCRS';
  var matrixIdsPropName = 'matrixIds';
  var identifierPropName = 'identifier';
  var scaleDenominatorPropName = 'scaleDenominator';
  var topLeftCornerPropName = 'topLeftCorner';
  var tileWidthPropName = 'tileWidth';
  var tileHeightPropName = 'tileHeight';

  var projection = ol.proj.get(matrixSet[supportedCRSPropName]);
  var metersPerUnit = projection.getMetersPerUnit();

  goog.array.sort(matrixSet[matrixIdsPropName], function(a, b) {
    return b[scaleDenominatorPropName] - a[scaleDenominatorPropName];
  });

  goog.array.forEach(matrixSet[matrixIdsPropName],
      function(elt, index, array) {
        matrixIds.push(elt[identifierPropName]);
        origins.push(elt[topLeftCornerPropName]);
        resolutions.push(elt[scaleDenominatorPropName] * 0.28E-3 /
            metersPerUnit);
        var tileWidth = elt[tileWidthPropName];
        var tileHeight = elt[tileHeightPropName];
        goog.asserts.assert(tileWidth == tileHeight);
        tileSizes.push(tileWidth);
      });

  return new ol.tilegrid.WMTS({
    origins: origins,
    resolutions: resolutions,
    matrixIds: matrixIds,
    tileSizes: tileSizes
  });
};
