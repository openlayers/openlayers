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
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @return {ol.Extent} Extent.
 */
ol.Extent.getForView2DAndSize = function(center, resolution, rotation, size) {
  var dx = resolution * size.width / 2;
  var dy = resolution * size.height / 2;
  var cosRotation = Math.cos(rotation);
  var sinRotation = Math.sin(rotation);
  var xs = [-dx, -dx, dx, dx];
  var ys = [-dy, dy, -dy, dy];
  var i, x, y;
  for (i = 0; i < 4; ++i) {
    x = xs[i];
    y = ys[i];
    xs[i] = center.x + x * cosRotation - y * sinRotation;
    ys[i] = center.y + x * sinRotation + y * cosRotation;
  }
  var minX = Math.min.apply(null, xs);
  var minY = Math.min.apply(null, ys);
  var maxX = Math.max.apply(null, xs);
  var maxY = Math.max.apply(null, ys);
  return new ol.Extent(minX, minY, maxX, maxY);
};


/**
 * Checks if the passed coordinate is contained or on the edge
 * of the extent.
 *
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains.
 */
ol.Extent.prototype.containsCoordinate = function(coordinate) {
  return this.minX <= coordinate.x && coordinate.x <= this.maxX &&
      this.minY <= coordinate.y && coordinate.y <= this.maxY;
};


/**
 * Checks if the passed extent is contained or on the edge of the
 * extent.
 *
 * @param {ol.Extent} extent Extent.
 * @return {boolean} Contains.
 */
ol.Extent.prototype.containsExtent = function(extent) {
  return this.minX <= extent.minX && extent.maxX <= this.maxX &&
      this.minY <= extent.minY && extent.maxY <= this.maxY;
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
  var input = [this.minX, this.minY, this.maxX, this.maxY];
  input = transformFn(input, input, 2);
  return new ol.Extent(Math.min(input[0], input[2]),
      Math.min(input[1], input[3]),
      Math.max(input[0], input[2]),
      Math.max(input[1], input[3]));
};
