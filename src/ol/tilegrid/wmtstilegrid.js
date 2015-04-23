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
      options.resolutions.length == options.matrixIds.length,
      'options resolutions and matrixIds must have equal length (%s == %s)',
      options.resolutions.length, options.matrixIds.length);

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
    tileSizes: options.tileSizes,
    widths: options.widths
  });

};
goog.inherits(ol.tilegrid.WMTS, ol.tilegrid.TileGrid);


/**
 * @param {number} z Z.
 * @return {string} MatrixId..
 */
ol.tilegrid.WMTS.prototype.getMatrixId = function(z) {
  goog.asserts.assert(0 <= z && z < this.matrixIds_.length,
      'attempted to retrive matrixId for illegal z (%s)', z);
  return this.matrixIds_[z];
};


/**
 * Get the list of matrix identifiers.
 * @return {Array.<string>} MatrixIds.
 * @api
 */
ol.tilegrid.WMTS.prototype.getMatrixIds = function() {
  return this.matrixIds_;
};


/**
 * Create a tile grid from a WMTS capabilities matrix set.
 * @param {Object} matrixSet An object representing a matrixSet in the
 *     capabilities document.
 * @return {ol.tilegrid.WMTS} WMTS tileGrid instance.
 * @api
 */
ol.tilegrid.WMTS.createFromCapabilitiesMatrixSet =
    function(matrixSet) {

  /** @type {!Array.<number>} */
  var resolutions = [];
  /** @type {!Array.<string>} */
  var matrixIds = [];
  /** @type {!Array.<ol.Coordinate>} */
  var origins = [];
  /** @type {!Array.<ol.Size>} */
  var tileSizes = [];
  /** @type {!Array.<number>} */
  var widths = [];

  var supportedCRSPropName = 'SupportedCRS';
  var matrixIdsPropName = 'TileMatrix';
  var identifierPropName = 'Identifier';
  var scaleDenominatorPropName = 'ScaleDenominator';
  var topLeftCornerPropName = 'TopLeftCorner';
  var tileWidthPropName = 'TileWidth';
  var tileHeightPropName = 'TileHeight';

  var projection;
  projection = ol.proj.get(matrixSet[supportedCRSPropName].replace(
      /urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3'));
  var metersPerUnit = projection.getMetersPerUnit();
  // swap origin x and y coordinates if axis orientation is lat/long
  var switchOriginXY = projection.getAxisOrientation().substr(0, 2) == 'ne';

  goog.array.sort(matrixSet[matrixIdsPropName], function(a, b) {
    return b[scaleDenominatorPropName] - a[scaleDenominatorPropName];
  });

  goog.array.forEach(matrixSet[matrixIdsPropName],
      function(elt, index, array) {
        matrixIds.push(elt[identifierPropName]);
        if (switchOriginXY) {
          origins.push([elt[topLeftCornerPropName][1],
            elt[topLeftCornerPropName][0]]);
        } else {
          origins.push(elt[topLeftCornerPropName]);
        }
        resolutions.push(elt[scaleDenominatorPropName] * 0.28E-3 /
            metersPerUnit);
        var tileWidth = elt[tileWidthPropName];
        var tileHeight = elt[tileHeightPropName];
        tileSizes.push(tileWidth == tileHeight ?
            tileWidth : [tileWidth, tileHeight]);
        widths.push(elt['MatrixWidth']);
      });

  return new ol.tilegrid.WMTS({
    origins: origins,
    resolutions: resolutions,
    matrixIds: matrixIds,
    tileSizes: tileSizes,
    widths: widths
  });
};
