goog.provide('ol.CoverageArea');

goog.require('ol.Extent');



/**
 * Represents a rectangular area.
 *
 * @constructor
 * @param {ol.Extent} extent Extent.
 */
ol.CoverageArea = function(extent) {

  /**
   * @type {ol.Extent}
   */
  this.extent = extent;

};


/**
 * @param {ol.Extent} extent Extent.
 * @return {boolean} Intersects.
 */
ol.CoverageArea.prototype.intersectsExtent = function(extent) {
  return this.extent.intersects(extent);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {boolean} Intersects.
 */
ol.CoverageArea.prototype.intersectsExtentAndResolution = goog.abstractMethod;


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} z Z.
 * @return {boolean} Intersects.
 */
ol.CoverageArea.prototype.intersectsExtentAndZ = goog.abstractMethod;


/**
 * @param {ol.TransformFunction} transformFn Transform.
 * @return {ol.CoverageArea} Transformed coverage area.
 */
ol.CoverageArea.prototype.transform = function(transformFn) {
  var extent = this.extent.transform(transformFn);
  return new ol.CoverageArea(extent);
};
