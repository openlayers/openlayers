goog.provide('ol.CoverageArea');

goog.require('ol.Extent');



/**
 * @constructor
 * @extends {ol.Extent}
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {number} minZ Minimum Z.
 * @param {number} maxZ Maximum Z.
 */
ol.CoverageArea = function(minX, minY, maxX, maxY, minZ, maxZ) {

  goog.base(this, minX, minY, maxX, maxY);

  /**
   * @type {number}
   */
  this.minZ = minZ;

  /**
   * @type {number}
   */
  this.maxZ = maxZ;

};
goog.inherits(ol.CoverageArea, ol.Extent);


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} z Z.
 * @return {boolean} Intersects.
 */
ol.CoverageArea.prototype.intersectsWithZ = function(extent, z) {
  return this.intersects(extent) && this.minZ <= z && z <= this.maxZ;
};


/**
 * @override
 * @param {ol.TransformFunction} transformFn Transform.
 * @return {ol.CoverageArea} Transformed coverage area.
 */
ol.CoverageArea.prototype.transform = function(transformFn) {
  var min = transformFn(new ol.Coordinate(this.minX, this.minY));
  var max = transformFn(new ol.Coordinate(this.maxX, this.maxY));
  return new ol.CoverageArea(min.x, min.y, max.x, max.y, this.minZ, this.maxZ);
};
