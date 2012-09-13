goog.provide('ol3.CoverageArea');

goog.require('ol3.Extent');



/**
 * @constructor
 * @param {ol3.Extent} extent Extent.
 */
ol3.CoverageArea = function(extent) {

  /**
   * @type {ol3.Extent}
   */
  this.extent = extent;

};


/**
 * @param {ol3.Extent} extent Extent.
 * @return {boolean} Intersects.
 */
ol3.CoverageArea.prototype.intersectsExtent = function(extent) {
  return this.extent.intersects(extent);
};


/**
 * @param {ol3.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @return {boolean} Intersects.
 */
ol3.CoverageArea.prototype.intersectsExtentAndResolution = goog.abstractMethod;


/**
 * @param {ol3.TransformFunction} transformFn Transform.
 * @return {ol3.CoverageArea} Transformed coverage area.
 */
ol3.CoverageArea.prototype.transform = function(transformFn) {
  var extent = this.extent.transform(transformFn);
  return new ol3.CoverageArea(extent);
};
