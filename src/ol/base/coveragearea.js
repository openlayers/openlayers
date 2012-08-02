goog.provide('ol.CoverageArea');

goog.require('ol.Extent');



/**
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
 * @param {number} resolution Resolution.
 * @return {boolean} Intersects.
 */
ol.CoverageArea.prototype.intersectsExtentAndResolution =
    function(extent, resolution) {
  return this.extent.intersects(extent);
};


/**
 * @param {ol.TransformFunction} transformFn Transform.
 * @return {ol.CoverageArea} Transformed coverage area.
 */
ol.CoverageArea.prototype.transform = function(transformFn) {
  var extent = this.extent.transform(transformFn);
  return new ol.CoverageArea(extent);
};
