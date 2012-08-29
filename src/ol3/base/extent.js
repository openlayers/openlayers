goog.provide('ol3.Extent');

goog.require('ol3.Coordinate');
goog.require('ol3.Rectangle');
goog.require('ol3.TransformFunction');



/**
 * @constructor
 * @extends {ol3.Rectangle}
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 */
ol3.Extent = function(minX, minY, maxX, maxY) {
  goog.base(this, minX, minY, maxX, maxY);
};
goog.inherits(ol3.Extent, ol3.Rectangle);


/**
 * @param {...ol3.Coordinate} var_args Coordinates.
 * @return {!ol3.Extent} Bounding extent.
 */
ol3.Extent.boundingExtent = function(var_args) {
  var coordinate0 = arguments[0];
  var extent = new ol3.Extent(coordinate0.x, coordinate0.y,
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
 * @return {ol3.Extent} Extent.
 */
ol3.Extent.prototype.clone = function() {
  return new ol3.Extent(this.minX, this.minY, this.maxX, this.maxY);
};


/**
 * @param {ol3.TransformFunction} transformFn Transform function.
 * @return {ol3.Extent} Extent.
 */
ol3.Extent.prototype.transform = function(transformFn) {
  var min = transformFn(new ol3.Coordinate(this.minX, this.minY));
  var max = transformFn(new ol3.Coordinate(this.maxX, this.maxY));
  return new ol3.Extent(min.x, min.y, max.x, max.y);
};
