goog.provide('ol.Extent');

goog.require('ol.Coordinate');
goog.require('ol.Rectangle');
goog.require('ol.TransformFunction');



/**
 * Rectangular extent which is not rotated. An extent does not know its
 * projection.
 *
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
 * Builds an extent that includes all given coordinates.
 *
 * @param {...ol.Coordinate} var_args Coordinates.
 * @return {!ol.Extent} Bounding extent.
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
 * Checks if the given coordinate is contained or on the edge of the extent.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains.
 */
ol.Extent.prototype.contains = function(coordinate) {
  return this.minX <= coordinate.x && coordinate.x <= this.maxX &&
      this.minY <= coordinate.y && coordinate.y <= this.maxY;
};


/**
 * @return {ol.Coordinate} Bottom left coordinate.
 */
ol.Extent.prototype.getBottomLeft = function() {
  return new ol.Coordinate(this.minX, this.minY);
};


/**
 * @return {ol.Coordinate} Bottom right coordinate.
 */
ol.Extent.prototype.getBottomRight = function() {
  return new ol.Coordinate(this.maxX, this.minY);
};


/**
 * @return {ol.Coordinate} Top left coordinate.
 */
ol.Extent.prototype.getTopLeft = function() {
  return new ol.Coordinate(this.minX, this.maxY);
};


/**
 * @return {ol.Coordinate} Top right coordinate.
 */
ol.Extent.prototype.getTopRight = function() {
  return new ol.Coordinate(this.maxX, this.maxY);
};


/**
 * @param {ol.TransformFunction} transformFn Transform function.
 * @return {ol.Extent} Extent.
 */
ol.Extent.prototype.transform = function(transformFn) {
  var a = transformFn(new ol.Coordinate(this.minX, this.minY));
  var b = transformFn(new ol.Coordinate(this.maxX, this.maxY));
  return new ol.Extent(Math.min(a.x, b.x), Math.min(a.y, b.y),
      Math.max(a.x, b.x), Math.max(a.y, b.y));
};
