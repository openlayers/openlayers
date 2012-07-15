goog.provide('ol.Extent');

goog.require('ol.Rectangle');
goog.require('ol.TransformFunction');



/**
 * @constructor
 * @extends {ol.Rectangle}
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 */
ol.Extent = function(minX, minY, maxX, maxY) {
  goog.base(this, minX, minY, maxX, maxY);
};
goog.inherits(ol.Extent, ol.Rectangle);


/**
 * @return {ol.Extent} Extent.
 */
ol.Extent.prototype.clone = function() {
  return new ol.Extent(this.minX, this.minY, this.maxX, this.maxY);
};


/**
 * @param {ol.TransformFunction} transform Transform.
 * @return {ol.Extent} Extent.
 */
ol.Extent.prototype.transform = function(transform) {
  var min = transform(new goog.math.Coordinate(this.minX, this.minY));
  var max = transform(new goog.math.Coordinate(this.maxX, this.maxY));
  return new ol.Extent(min.x, min.y, max.x, max.y);
};
