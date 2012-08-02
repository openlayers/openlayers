goog.provide('ol.TileCoverageArea');

goog.require('ol.CoverageArea');
goog.require('ol.Extent');
goog.require('ol.TileGrid');



/**
 * @constructor
 * @extends {ol.CoverageArea}
 * @param {ol.TileGrid} tileGrid Tile grid.
 * @param {ol.Extent} extent Extent.
 * @param {number} minZ Minimum Z.
 * @param {number} maxZ Maximum Z.
 */
ol.TileCoverageArea = function(tileGrid, extent, minZ, maxZ) {

  goog.base(this, extent);

  /**
   * @private
   * @type {ol.TileGrid}
   */
  this.tileGrid_ = tileGrid;

  /**
   * @private
   * @type {number}
   */
  this.minZ_ = minZ;

  /**
   * @private
   * @type {number}
   */
  this.maxZ_ = maxZ;

};
goog.inherits(ol.TileCoverageArea, ol.CoverageArea);


/**
 * @inheritDoc
 */
ol.TileCoverageArea.prototype.intersectsExtentAndResolution =
    function(extent, resolution) {
  var z = this.tileGrid_.getZForResolution(resolution);
  return this.intersectsExtentAndZ(extent, z);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} z Z.
 * @return {boolean} Intersects.
 */
ol.TileCoverageArea.prototype.intersectsExtentAndZ = function(extent, z) {
  return this.minZ_ <= z && z <= this.maxZ_ && this.intersectsExtent(extent);
};


/**
 * @param {ol.TransformFunction} transformFn Transform.
 * @return {ol.TileCoverageArea} Transformed tile coverage area.
 */
ol.TileCoverageArea.prototype.transform = function(transformFn) {
  var extent = this.extent.transform(transformFn);
  return new ol.TileCoverageArea(
      this.tileGrid_, extent, this.minZ_, this.maxZ_);
};
