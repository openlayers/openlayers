goog.provide('ol.filter.Extent');

goog.require('ol.Extent');
goog.require('ol.filter.Filter');



/**
 * @constructor
 * @implements {ol.filter.Filter}
 * @param {ol.Extent} extent The extent.
 */
ol.filter.Extent = function(extent) {

  /**
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = extent;

};


/**
 * @return {ol.Extent} The filter extent.
 */
ol.filter.Extent.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * @inheritDoc
 */
ol.filter.Extent.prototype.applies = function(feature) {
  return feature.getGeometry().getBounds().intersects(this.extent_);
};
