goog.provide('ol.CoverageArea');

goog.require('ol.Extent');



/**
 * @constructor
 * @param {ol.Extent} extent Extent.
 * @param {number} minZ Minimum Z.
 * @param {number} maxZ Maximum Z.
 */
ol.CoverageArea = function(extent, minZ, maxZ) {

  /**
   * @type {ol.Extent}
   */
  this.extent = extent;

  /**
   * @type {number}
   */
  this.minZ = minZ;

  /**
   * @type {number}
   */
  this.maxZ = maxZ;

};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} z Z.
 * @return {boolean} Intersects.
 */
ol.CoverageArea.prototype.intersectsWithZ = function(extent, z) {
  return this.extent.intersects(extent) && this.minZ <= z && z <= this.maxZ;
};


/**
 * @param {ol.TransformFunction} transformFn Transform.
 * @return {ol.CoverageArea} Transformed coverage area.
 */
ol.CoverageArea.prototype.transform = function(transformFn) {
  var extent = this.extent.transform(transformFn);
  return new ol.CoverageArea(extent, this.minZ, this.maxZ);
};
