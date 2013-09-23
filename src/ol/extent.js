goog.provide('ol.Extent');
goog.provide('ol.extent');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.Size');
goog.require('ol.TransformFunction');


/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 * @typedef {Array.<number>}
 * @todo stability experimental
 */
ol.Extent;


/**
 * Builds an extent that includes all given coordinates.
 *
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @return {ol.Extent} Bounding extent.
 * @todo stability experimental
 */
ol.extent.boundingExtent = function(coordinates) {
  var extent = ol.extent.createEmpty();
  var n = coordinates.length;
  var i;
  for (i = 0; i < n; ++i) {
    ol.extent.extendCoordinate(extent, coordinates[i]);
  }
  return extent;
};


/**
 * @param {Array.<number>} xs Xs.
 * @param {Array.<number>} ys Ys.
 * @param {ol.Extent=} opt_extent Destination extent.
 * @private
 * @return {ol.Extent} Extent.
 * @todo stability experimental
 */
ol.extent.boundingExtentXYs_ = function(xs, ys, opt_extent) {
  goog.asserts.assert(xs.length > 0);
  goog.asserts.assert(ys.length > 0);
  var minX = Math.min.apply(null, xs);
  var maxX = Math.max.apply(null, xs);
  var minY = Math.min.apply(null, ys);
  var maxY = Math.max.apply(null, ys);
  return ol.extent.createOrUpdate(minX, maxX, minY, maxY, opt_extent);
};


/**
 * Increase an extent by the provided value.
 * @param {ol.Extent} extent The extent to buffer.
 * @param {number} value The amount by wich the extent should be buffered.
 */
ol.extent.buffer = function(extent, value) {
  extent[0] -= value;
  extent[1] -= value;
  extent[2] += value;
  extent[3] += value;
};


/**
 * Creates a clone of an extent.
 *
 * @param {ol.Extent} extent Extent to clone.
 * @return {ol.Extent} The clone.
 * @todo stability experimental
 */
ol.extent.clone = function(extent) {
  return extent.slice();
};


/**
 * Checks if the passed coordinate is contained or on the edge of the extent.
 *
 * @param {ol.Extent} extent Extent.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains.
 * @todo stability experimental
 */
ol.extent.containsCoordinate = function(extent, coordinate) {
  return extent[0] <= coordinate[0] && coordinate[0] <= extent[2] &&
      extent[1] <= coordinate[1] && coordinate[1] <= extent[3];
};


/**
 * Checks if `extent2` is contained by or on the edge of `extent1`.
 *
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @return {boolean} Contains.
 * @todo stability experimental
 */
ol.extent.containsExtent = function(extent1, extent2) {
  return extent1[0] <= extent2[0] && extent2[2] <= extent1[2] &&
      extent1[1] <= extent2[1] && extent2[3] <= extent1[3];
};


/**
 * @return {ol.Extent} Empty extent.
 * @todo stability experimental
 */
ol.extent.createEmpty = function() {
  return [Infinity, Infinity, -Infinity, -Infinity];
};


/**
 * @param {number} minX Minimum X.
 * @param {number} maxX Maximum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxY Maximum Y.
 * @param {ol.Extent=} opt_extent Destination extent.
 * @return {ol.Extent} Extent.
 * @todo stability experimental
 */
ol.extent.createOrUpdate = function(minX, maxX, minY, maxY, opt_extent) {
  if (goog.isDef(opt_extent)) {
    opt_extent[0] = minX;
    opt_extent[2] = maxX;
    opt_extent[1] = minY;
    opt_extent[3] = maxY;
    return opt_extent;
  } else {
    return [minX, minY, maxX, maxY];
  }
};


/**
 * Empties extent in place.
 * @param {ol.Extent} extent Extent.
 * @return {ol.Extent} Extent.
 * @todo stability experimental
 */
ol.extent.empty = function(extent) {
  extent[0] = extent[1] = Infinity;
  extent[2] = extent[3] = -Infinity;
  return extent;
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @return {boolean} Equals.
 * @todo stability experimental
 */
ol.extent.equals = function(extent1, extent2) {
  return extent1[0] == extent2[0] && extent1[2] == extent2[2] &&
      extent1[1] == extent2[1] && extent1[3] == extent2[3];
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @todo stability experimental
 */
ol.extent.extend = function(extent1, extent2) {
  if (extent2[0] < extent1[0]) {
    extent1[0] = extent2[0];
  }
  if (extent2[2] > extent1[2]) {
    extent1[2] = extent2[2];
  }
  if (extent2[1] < extent1[1]) {
    extent1[1] = extent2[1];
  }
  if (extent2[3] > extent1[3]) {
    extent1[3] = extent2[3];
  }
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @todo stability experimental
 */
ol.extent.extendCoordinate = function(extent, coordinate) {
  if (coordinate[0] < extent[0]) {
    extent[0] = coordinate[0];
  }
  if (coordinate[0] > extent[2]) {
    extent[2] = coordinate[0];
  }
  if (coordinate[1] < extent[1]) {
    extent[1] = coordinate[1];
  }
  if (coordinate[1] > extent[3]) {
    extent[3] = coordinate[1];
  }
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Bottom left coordinate.
 * @todo stability experimental
 */
ol.extent.getBottomLeft = function(extent) {
  return [extent[0], extent[1]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Bottom right coordinate.
 * @todo stability experimental
 */
ol.extent.getBottomRight = function(extent) {
  return [extent[2], extent[1]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Center.
 * @todo stability experimental
 */
ol.extent.getCenter = function(extent) {
  return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
};


/**
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {ol.Extent=} opt_extent Destination extent.
 * @return {ol.Extent} Extent.
 * @todo stability experimental
 */
ol.extent.getForView2DAndSize =
    function(center, resolution, rotation, size, opt_extent) {
  var dx = resolution * size[0] / 2;
  var dy = resolution * size[1] / 2;
  var cosRotation = Math.cos(rotation);
  var sinRotation = Math.sin(rotation);
  /** @type {Array.<number>} */
  var xs = [-dx, -dx, dx, dx];
  /** @type {Array.<number>} */
  var ys = [-dy, dy, -dy, dy];
  var i, x, y;
  for (i = 0; i < 4; ++i) {
    x = xs[i];
    y = ys[i];
    xs[i] = center[0] + x * cosRotation - y * sinRotation;
    ys[i] = center[1] + x * sinRotation + y * cosRotation;
  }
  return ol.extent.boundingExtentXYs_(xs, ys, opt_extent);
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {number} Height.
 * @todo stability experimental
 */
ol.extent.getHeight = function(extent) {
  return extent[3] - extent[1];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Size} Size.
 * @todo stability experimental
 */
ol.extent.getSize = function(extent) {
  return [extent[2] - extent[0], extent[3] - extent[1]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Top left coordinate.
 * @todo stability experimental
 */
ol.extent.getTopLeft = function(extent) {
  return [extent[0], extent[3]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Top right coordinate.
 * @todo stability experimental
 */
ol.extent.getTopRight = function(extent) {
  return [extent[2], extent[3]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {number} Width.
 * @todo stability experimental
 */
ol.extent.getWidth = function(extent) {
  return extent[2] - extent[0];
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent.
 * @return {boolean} Intersects.
 * @todo stability experimental
 */
ol.extent.intersects = function(extent1, extent2) {
  return extent1[0] <= extent2[2] &&
      extent1[2] >= extent2[0] &&
      extent1[1] <= extent2[3] &&
      extent1[3] >= extent2[1];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {boolean} Is empty.
 * @todo stability experimental
 */
ol.extent.isEmpty = function(extent) {
  return extent[2] < extent[0] || extent[3] < extent[1];
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol.Coordinate} Coordinate.
 * @todo stability experimental
 */
ol.extent.normalize = function(extent, coordinate) {
  return [
    (coordinate[0] - extent[0]) / (extent[2] - extent[0]),
    (coordinate[1] - extent[1]) / (extent[3] - extent[1])
  ];
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} value Value.
 * @todo stability experimental
 */
ol.extent.scaleFromCenter = function(extent, value) {
  var deltaX = ((extent[2] - extent[0]) / 2) * (value - 1);
  var deltaY = ((extent[3] - extent[1]) / 2) * (value - 1);
  extent[0] -= deltaX;
  extent[2] += deltaX;
  extent[1] -= deltaY;
  extent[3] += deltaY;
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @return {boolean} Touches.
 * @todo stability experimental
 */
ol.extent.touches = function(extent1, extent2) {
  var intersects = ol.extent.intersects(extent1, extent2);
  return intersects &&
      (extent1[0] == extent2[2] || extent1[2] == extent2[0] ||
       extent1[1] == extent2[3] || extent1[3] == extent2[1]);
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.TransformFunction} transformFn Transform function.
 * @param {ol.Extent=} opt_extent Destination extent.
 * @return {ol.Extent} Extent.
 * @todo stability experimental
 */
ol.extent.transform = function(extent, transformFn, opt_extent) {
  var coordinates = [
    extent[0], extent[1],
    extent[0], extent[3],
    extent[2], extent[1],
    extent[2], extent[3]
  ];
  transformFn(coordinates, coordinates, 2);
  var xs = [coordinates[0], coordinates[2], coordinates[4], coordinates[6]];
  var ys = [coordinates[1], coordinates[3], coordinates[5], coordinates[7]];
  return ol.extent.boundingExtentXYs_(xs, ys, opt_extent);
};
