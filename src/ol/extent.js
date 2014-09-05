goog.provide('ol.Extent');
goog.provide('ol.extent');
goog.provide('ol.extent.Corner');
goog.provide('ol.extent.Relationship');

goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.Coordinate');
goog.require('ol.Size');
goog.require('ol.TransformFunction');


/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 * @typedef {Array.<number>}
 * @api stable
 */
ol.Extent;


/**
 * Extent corner.
 * @enum {string}
 */
ol.extent.Corner = {
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right'
};


/**
 * Relationship to an extent.
 * @enum {number}
 */
ol.extent.Relationship = {
  UNKNOWN: 0,
  INTERSECTING: 1,
  ABOVE: 2,
  RIGHT: 4,
  BELOW: 8,
  LEFT: 16
};


/**
 * Builds an extent that includes all given coordinates.
 *
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @return {ol.Extent} Bounding extent.
 * @api stable
 */
ol.extent.boundingExtent = function(coordinates) {
  var extent = ol.extent.createEmpty();
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
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
 */
ol.extent.boundingExtentXYs_ = function(xs, ys, opt_extent) {
  goog.asserts.assert(xs.length > 0);
  goog.asserts.assert(ys.length > 0);
  var minX = Math.min.apply(null, xs);
  var minY = Math.min.apply(null, ys);
  var maxX = Math.max.apply(null, xs);
  var maxY = Math.max.apply(null, ys);
  return ol.extent.createOrUpdate(minX, minY, maxX, maxY, opt_extent);
};


/**
 * Return extent increased by the provided value.
 * @param {ol.Extent} extent Extent.
 * @param {number} value The amount by which the extent should be buffered.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 * @api stable
 */
ol.extent.buffer = function(extent, value, opt_extent) {
  if (goog.isDef(opt_extent)) {
    opt_extent[0] = extent[0] - value;
    opt_extent[1] = extent[1] - value;
    opt_extent[2] = extent[2] + value;
    opt_extent[3] = extent[3] + value;
    return opt_extent;
  } else {
    return [
      extent[0] - value,
      extent[1] - value,
      extent[2] + value,
      extent[3] + value
    ];
  }
};


/**
 * Creates a clone of an extent.
 *
 * @param {ol.Extent} extent Extent to clone.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} The clone.
 */
ol.extent.clone = function(extent, opt_extent) {
  if (goog.isDef(opt_extent)) {
    opt_extent[0] = extent[0];
    opt_extent[1] = extent[1];
    opt_extent[2] = extent[2];
    opt_extent[3] = extent[3];
    return opt_extent;
  } else {
    return extent.slice();
  }
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {number} Closest squared distance.
 */
ol.extent.closestSquaredDistanceXY = function(extent, x, y) {
  var dx, dy;
  if (x < extent[0]) {
    dx = extent[0] - x;
  } else if (extent[2] < x) {
    dx = x - extent[2];
  } else {
    dx = 0;
  }
  if (y < extent[1]) {
    dy = extent[1] - y;
  } else if (extent[3] < y) {
    dy = y - extent[3];
  } else {
    dy = 0;
  }
  return dx * dx + dy * dy;
};


/**
 * Checks if the passed coordinate is contained or on the edge of the extent.
 *
 * @param {ol.Extent} extent Extent.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains.
 * @api stable
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
 * @api stable
 */
ol.extent.containsExtent = function(extent1, extent2) {
  return extent1[0] <= extent2[0] && extent2[2] <= extent1[2] &&
      extent1[1] <= extent2[1] && extent2[3] <= extent1[3];
};


/**
 * Get the relationship between a coordinate and extent.
 * @param {ol.Extent} extent The extent.
 * @param {ol.Coordinate} coordinate The coordinate.
 * @return {number} The relationship (bitwise compare with
 *     ol.extent.Relationship).
 */
ol.extent.coordinateRelationship = function(extent, coordinate) {
  var minX = extent[0];
  var minY = extent[1];
  var maxX = extent[2];
  var maxY = extent[3];
  var x = coordinate[0];
  var y = coordinate[1];
  var relationship = ol.extent.Relationship.UNKNOWN;
  if (x < minX) {
    relationship = relationship | ol.extent.Relationship.LEFT;
  } else if (x > maxX) {
    relationship = relationship | ol.extent.Relationship.RIGHT;
  }
  if (y < minY) {
    relationship = relationship | ol.extent.Relationship.BELOW;
  } else if (y > maxY) {
    relationship = relationship | ol.extent.Relationship.ABOVE;
  }
  if (relationship === ol.extent.Relationship.UNKNOWN) {
    relationship = ol.extent.Relationship.INTERSECTING;
  }
  return relationship;
};


/**
 * @return {ol.Extent} Empty extent.
 * @api stable
 */
ol.extent.createEmpty = function() {
  return [Infinity, Infinity, -Infinity, -Infinity];
};


/**
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {ol.Extent=} opt_extent Destination extent.
 * @return {ol.Extent} Extent.
 */
ol.extent.createOrUpdate = function(minX, minY, maxX, maxY, opt_extent) {
  if (goog.isDef(opt_extent)) {
    opt_extent[0] = minX;
    opt_extent[1] = minY;
    opt_extent[2] = maxX;
    opt_extent[3] = maxY;
    return opt_extent;
  } else {
    return [minX, minY, maxX, maxY];
  }
};


/**
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 */
ol.extent.createOrUpdateEmpty = function(opt_extent) {
  return ol.extent.createOrUpdate(
      Infinity, Infinity, -Infinity, -Infinity, opt_extent);
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 */
ol.extent.createOrUpdateFromCoordinate = function(coordinate, opt_extent) {
  var x = coordinate[0];
  var y = coordinate[1];
  return ol.extent.createOrUpdate(x, y, x, y, opt_extent);
};


/**
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 */
ol.extent.createOrUpdateFromCoordinates = function(coordinates, opt_extent) {
  var extent = ol.extent.createOrUpdateEmpty(opt_extent);
  return ol.extent.extendCoordinates(extent, coordinates);
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 */
ol.extent.createOrUpdateFromFlatCoordinates =
    function(flatCoordinates, offset, end, stride, opt_extent) {
  var extent = ol.extent.createOrUpdateEmpty(opt_extent);
  return ol.extent.extendFlatCoordinates(
      extent, flatCoordinates, offset, end, stride);
};


/**
 * @param {Array.<Array.<ol.Coordinate>>} rings Rings.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 */
ol.extent.createOrUpdateFromRings = function(rings, opt_extent) {
  var extent = ol.extent.createOrUpdateEmpty(opt_extent);
  return ol.extent.extendRings(extent, rings);
};


/**
 * Empties extent in place.
 * @param {ol.Extent} extent Extent.
 * @return {ol.Extent} Extent.
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
 * @api stable
 */
ol.extent.equals = function(extent1, extent2) {
  return extent1[0] == extent2[0] && extent1[2] == extent2[2] &&
      extent1[1] == extent2[1] && extent1[3] == extent2[3];
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @return {ol.Extent} Extent.
 * @api stable
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
  return extent1;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Coordinate} coordinate Coordinate.
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
 * @param {Array.<ol.Coordinate>} coordinates Coordinates.
 * @return {ol.Extent} Extent.
 */
ol.extent.extendCoordinates = function(extent, coordinates) {
  var i, ii;
  for (i = 0, ii = coordinates.length; i < ii; ++i) {
    ol.extent.extendCoordinate(extent, coordinates[i]);
  }
  return extent;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {ol.Extent} Extent.
 */
ol.extent.extendFlatCoordinates =
    function(extent, flatCoordinates, offset, end, stride) {
  for (; offset < end; offset += stride) {
    ol.extent.extendXY(
        extent, flatCoordinates[offset], flatCoordinates[offset + 1]);
  }
  return extent;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {Array.<Array.<ol.Coordinate>>} rings Rings.
 * @return {ol.Extent} Extent.
 */
ol.extent.extendRings = function(extent, rings) {
  var i, ii;
  for (i = 0, ii = rings.length; i < ii; ++i) {
    ol.extent.extendCoordinates(extent, rings[i]);
  }
  return extent;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.extent.extendXY = function(extent, x, y) {
  extent[0] = Math.min(extent[0], x);
  extent[1] = Math.min(extent[1], y);
  extent[2] = Math.max(extent[2], x);
  extent[3] = Math.max(extent[3], y);
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {number} Area.
 */
ol.extent.getArea = function(extent) {
  var area = 0;
  if (!ol.extent.isEmpty(extent)) {
    area = ol.extent.getWidth(extent) * ol.extent.getHeight(extent);
  }
  return area;
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Bottom left coordinate.
 * @api stable
 */
ol.extent.getBottomLeft = function(extent) {
  return [extent[0], extent[1]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Bottom right coordinate.
 * @api stable
 */
ol.extent.getBottomRight = function(extent) {
  return [extent[2], extent[1]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Center.
 * @api stable
 */
ol.extent.getCenter = function(extent) {
  return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
};


/**
 * Get a corner coordinate of an extent.
 * @param {ol.Extent} extent Extent.
 * @param {ol.extent.Corner} corner Corner.
 * @return {ol.Coordinate} Corner coordinate.
 */
ol.extent.getCorner = function(extent, corner) {
  var coordinate;
  if (corner === ol.extent.Corner.BOTTOM_LEFT) {
    coordinate = ol.extent.getBottomLeft(extent);
  } else if (corner === ol.extent.Corner.BOTTOM_RIGHT) {
    coordinate = ol.extent.getBottomRight(extent);
  } else if (corner === ol.extent.Corner.TOP_LEFT) {
    coordinate = ol.extent.getTopLeft(extent);
  } else if (corner === ol.extent.Corner.TOP_RIGHT) {
    coordinate = ol.extent.getTopRight(extent);
  } else {
    goog.asserts.fail('Invalid corner: %s', corner);
  }
  goog.asserts.assert(goog.isDef(coordinate));
  return coordinate;
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @return {number} Enlarged area.
 */
ol.extent.getEnlargedArea = function(extent1, extent2) {
  var minX = Math.min(extent1[0], extent2[0]);
  var minY = Math.min(extent1[1], extent2[1]);
  var maxX = Math.max(extent1[2], extent2[2]);
  var maxY = Math.max(extent1[3], extent2[3]);
  return (maxX - minX) * (maxY - minY);
};


/**
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {ol.Extent=} opt_extent Destination extent.
 * @return {ol.Extent} Extent.
 */
ol.extent.getForViewAndSize =
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
 * @api stable
 */
ol.extent.getHeight = function(extent) {
  return extent[3] - extent[1];
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @return {number} Intersection area.
 */
ol.extent.getIntersectionArea = function(extent1, extent2) {
  var intersection = ol.extent.getIntersection(extent1, extent2);
  return ol.extent.getArea(intersection);
};


/**
 * Get the intersection of two extents.
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @param {ol.Extent=} opt_extent Optional extent to populate with intersection.
 * @return {ol.Extent} Intersecting extent.
 */
ol.extent.getIntersection = function(extent1, extent2, opt_extent) {
  var intersection = goog.isDef(opt_extent) ?
      opt_extent : ol.extent.createEmpty();
  if (ol.extent.intersects(extent1, extent2)) {
    if (extent1[0] > extent2[0]) {
      intersection[0] = extent1[0];
    } else {
      intersection[0] = extent2[0];
    }
    if (extent1[1] > extent2[1]) {
      intersection[1] = extent1[1];
    } else {
      intersection[1] = extent2[1];
    }
    if (extent1[2] < extent2[2]) {
      intersection[2] = extent1[2];
    } else {
      intersection[2] = extent2[2];
    }
    if (extent1[3] < extent2[3]) {
      intersection[3] = extent1[3];
    } else {
      intersection[3] = extent2[3];
    }
  }
  return intersection;
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {number} Margin.
 */
ol.extent.getMargin = function(extent) {
  return ol.extent.getWidth(extent) + ol.extent.getHeight(extent);
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Size} Size.
 * @api stable
 */
ol.extent.getSize = function(extent) {
  return [extent[2] - extent[0], extent[3] - extent[1]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Top left coordinate.
 * @api stable
 */
ol.extent.getTopLeft = function(extent) {
  return [extent[0], extent[3]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.Coordinate} Top right coordinate.
 * @api stable
 */
ol.extent.getTopRight = function(extent) {
  return [extent[2], extent[3]];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {number} Width.
 * @api stable
 */
ol.extent.getWidth = function(extent) {
  return extent[2] - extent[0];
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent.
 * @return {boolean} Intersects.
 * @api stable
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
 * @api stable
 */
ol.extent.isEmpty = function(extent) {
  return extent[2] < extent[0] || extent[3] < extent[1];
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {boolean} Is infinite.
 */
ol.extent.isInfinite = function(extent) {
  return extent[0] == -Infinity || extent[1] == -Infinity ||
      extent[2] == Infinity || extent[3] == Infinity;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol.Coordinate} Coordinate.
 */
ol.extent.normalize = function(extent, coordinate) {
  return [
    (coordinate[0] - extent[0]) / (extent[2] - extent[0]),
    (coordinate[1] - extent[1]) / (extent[3] - extent[1])
  ];
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {ol.Extent=} opt_extent Extent.
 * @return {ol.Extent} Extent.
 */
ol.extent.returnOrUpdate = function(extent, opt_extent) {
  if (goog.isDef(opt_extent)) {
    opt_extent[0] = extent[0];
    opt_extent[1] = extent[1];
    opt_extent[2] = extent[2];
    opt_extent[3] = extent[3];
    return opt_extent;
  } else {
    return extent;
  }
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} value Value.
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
 * Determine if the segment between two coordinates intersects (crosses,
 * touches, or is contained by) the provided extent.
 * @param {ol.Extent} extent The extent.
 * @param {ol.Coordinate} start Segment start coordinate.
 * @param {ol.Coordinate} end Segment end coordinate.
 * @return {boolean} The segment intersects the extent.
 */
ol.extent.segmentIntersects = function(extent, start, end) {
  var intersects = false;
  var startRel = ol.extent.coordinateRelationship(extent, start);
  var endRel = ol.extent.coordinateRelationship(extent, end);
  if (startRel === ol.extent.Relationship.INTERSECTING ||
      endRel === ol.extent.Relationship.INTERSECTING) {
    intersects = true;
  } else {
    var minX = extent[0];
    var minY = extent[1];
    var maxX = extent[2];
    var maxY = extent[3];
    var startX = start[0];
    var startY = start[1];
    var endX = end[0];
    var endY = end[1];
    var slope = (endY - startY) / (endX - startX);
    var x, y;
    if (!!(endRel & ol.extent.Relationship.ABOVE) &&
        !(startRel & ol.extent.Relationship.ABOVE)) {
      // potentially intersects top
      x = endX - ((endY - maxY) / slope);
      intersects = x >= minX && x <= maxX;
    } else if (!!(endRel & ol.extent.Relationship.RIGHT) &&
        !(startRel & ol.extent.Relationship.RIGHT)) {
      // potentially intersects right
      y = endY - ((endX - maxX) * slope);
      intersects = y >= minY && y <= maxY;
    } else if (!!(endRel & ol.extent.Relationship.BELOW) &&
        !(startRel & ol.extent.Relationship.BELOW)) {
      // potentially intersects bottom
      x = endX - ((endY - minY) / slope);
      intersects = x >= minX && x <= maxX;
    } else if (!!(endRel & ol.extent.Relationship.LEFT) &&
        !(startRel & ol.extent.Relationship.LEFT)) {
      // potentially intersects left
      y = endY - ((endX - minX) * slope);
      intersects = y >= minY && y <= maxY;
    }

  }
  return intersects;
};


/**
 * @param {ol.Extent} extent1 Extent 1.
 * @param {ol.Extent} extent2 Extent 2.
 * @return {boolean} Touches.
 */
ol.extent.touches = function(extent1, extent2) {
  var intersects = ol.extent.intersects(extent1, extent2);
  return intersects &&
      (extent1[0] == extent2[2] || extent1[2] == extent2[0] ||
       extent1[1] == extent2[3] || extent1[3] == extent2[1]);
};


/**
 * Apply a transform function to the extent.
 * @param {ol.Extent} extent Extent.
 * @param {ol.TransformFunction} transformFn Transform function.  Called with
 * [minX, minY, maxX, maxY] extent coordinates.
 * @param {ol.Extent=} opt_extent Destination extent.
 * @return {ol.Extent} Extent.
 * @api stable
 */
ol.extent.applyTransform = function(extent, transformFn, opt_extent) {
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


/**
 * Apply a 2d transform to an extent.
 * @param {ol.Extent} extent Input extent.
 * @param {goog.vec.Mat4.Number} transform The transform matrix.
 * @param {ol.Extent=} opt_extent Optional extent for return values.
 * @return {ol.Extent} The transformed extent.
 */
ol.extent.transform2D = function(extent, transform, opt_extent) {
  var dest = goog.isDef(opt_extent) ? opt_extent : [];
  var m00 = goog.vec.Mat4.getElement(transform, 0, 0);
  var m10 = goog.vec.Mat4.getElement(transform, 1, 0);
  var m01 = goog.vec.Mat4.getElement(transform, 0, 1);
  var m11 = goog.vec.Mat4.getElement(transform, 1, 1);
  var m03 = goog.vec.Mat4.getElement(transform, 0, 3);
  var m13 = goog.vec.Mat4.getElement(transform, 1, 3);
  var xi = [0, 2, 0, 2];
  var yi = [1, 1, 3, 3];
  var xs = [];
  var ys = [];
  var i, x, y;
  for (i = 0; i < 4; ++i) {
    x = extent[xi[i]];
    y = extent[yi[i]];
    xs[i] = m00 * x + m01 * y + m03;
    ys[i] = m10 * x + m11 * y + m13;
  }
  dest[0] = Math.min.apply(null, xs);
  dest[1] = Math.min.apply(null, ys);
  dest[2] = Math.max.apply(null, xs);
  dest[3] = Math.max.apply(null, ys);
  return dest;
};
