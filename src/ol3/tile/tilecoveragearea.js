goog.provide('ol3.TileCoverageArea');

goog.require('ol3.CoverageArea');
goog.require('ol3.Extent');
goog.require('ol3.TileGrid');



/**
 * @constructor
 * @extends {ol3.CoverageArea}
 * @param {ol3.TileGrid} tileGrid Tile grid.
 * @param {ol3.Extent} extent Extent.
 * @param {number} minZ Minimum Z.
 * @param {number} maxZ Maximum Z.
 */
ol3.TileCoverageArea = function(tileGrid, extent, minZ, maxZ) {

  goog.base(this, extent);

  /**
   * @private
   * @type {ol3.TileGrid}
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
goog.inherits(ol3.TileCoverageArea, ol3.CoverageArea);


/**
 * @inheritDoc
 */
ol3.TileCoverageArea.prototype.intersectsExtentAndResolution =
    function(extent, resolution) {
  var z = this.tileGrid_.getZForResolution(resolution);
  return this.intersectsExtentAndZ(extent, z);
};


/**
 * @param {ol3.Extent} extent Extent.
 * @param {number} z Z.
 * @return {boolean} Intersects.
 */
ol3.TileCoverageArea.prototype.intersectsExtentAndZ = function(extent, z) {
  return this.minZ_ <= z && z <= this.maxZ_ && this.intersectsExtent(extent);
};


/**
 * @param {ol3.TransformFunction} transformFn Transform.
 * @return {ol3.TileCoverageArea} Transformed tile coverage area.
 */
ol3.TileCoverageArea.prototype.transform = function(transformFn) {
  var extent = this.extent.transform(transformFn);
  return new ol3.TileCoverageArea(
      this.tileGrid_, extent, this.minZ_, this.maxZ_);
};
