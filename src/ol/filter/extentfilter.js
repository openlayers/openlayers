goog.provide('ol.filter.Extent');

goog.require('ol.extent');
goog.require('ol.filter.Filter');



/**
 * @constructor
 * @extends {ol.filter.Filter}
 * @param {ol.Extent} extent The extent.
 */
ol.filter.Extent = function(extent) {
  goog.base(this);

  /**
   * @type {ol.Extent}
   * @private
   */
  this.extent_ = extent;

};
goog.inherits(ol.filter.Extent, ol.filter.Filter);


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
  return ol.extent.intersects(feature.getGeometry().getBounds(), this.extent_);
};
