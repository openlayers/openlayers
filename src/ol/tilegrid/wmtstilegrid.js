goog.provide('ol.tilegrid.WMTS');

goog.require('ol.Size');
goog.require('ol.projection');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.tilegrid.TileGrid}
 * @param {ol.tilegrid.WMTSOptions} wmtsOptions WMTS options.
 */
ol.tilegrid.WMTS = function(wmtsOptions) {

  goog.asserts.assert(
      wmtsOptions.resolutions.length == wmtsOptions.matrixIds.length);

  /**
   * @private
   * @type {!Array.<string>}
   */
  this.matrixIds_ = wmtsOptions.matrixIds;
  // FIXME: should the matrixIds become optionnal?

  goog.base(this, {
    origin: wmtsOptions.origin,
    origins: wmtsOptions.origins,
    resolutions: wmtsOptions.resolutions,
    tileSize: wmtsOptions.tileSize,
    tileSizes: wmtsOptions.tileSizes
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
 */
ol.tilegrid.WMTS.prototype.getMatrixIds = function() {
  return this.matrixIds_;
};
