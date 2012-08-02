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
   * @type {number}
   */
  this.minZ = minZ;

  /**
   * @type {number}
   */
  this.maxZ = maxZ;

};
goog.inherits(ol.TileCoverageArea, ol.CoverageArea);


/**
 * @inheritDoc
 */
ol.TileCoverageArea.prototype.intersectsExtentAndResolution =
    function(extent, resolution) {
  var z = this.tileGrid_.getZForResolution(resolution);
  return this.minZ <= z && z <= this.maxZ &&
      goog.base(this, 'intersectsExtentAndResolution', extent, resolution);
};


/**
 * @param {ol.TransformFunction} transformFn Transform.
 * @return {ol.TileCoverageArea} Transformed tile coverage area.
 */
ol.TileCoverageArea.prototype.transform = function(transformFn) {
  var extent = this.extent.transform(transformFn);
  return new ol.TileCoverageArea(this.tileGrid_, extent, this.minZ, this.maxZ);
};
