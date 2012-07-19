goog.provide('ol.Extent');

goog.require('ol.Coordinate');
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
 * @param {...ol.Coordinate} var_args Coordinates.
 * @return {!ol.Extent} Boundin extent.
 */
ol.Extent.boundingExtent = function(var_args) {
  var coordinate0 = arguments[0];
  var extent = new ol.Extent(coordinate0.x, coordinate0.y,
                             coordinate0.x, coordinate0.y);
  var i;
  for (i = 1; i < arguments.length; ++i) {
    var coordinate = arguments[i];
    extent.minX = Math.min(extent.minX, coordinate.x);
    extent.minY = Math.min(extent.minY, coordinate.y);
    extent.maxX = Math.max(extent.maxX, coordinate.x);
    extent.maxY = Math.max(extent.maxY, coordinate.y);
  }
  return extent;
};


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
  var min = transform(new ol.Coordinate(this.minX, this.minY));
  var max = transform(new ol.Coordinate(this.maxX, this.maxY));
  return new ol.Extent(min.x, min.y, max.x, max.y);
};
