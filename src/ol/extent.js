/**
 * @module ol/extent
 */
import {assert} from './asserts.js';
import Corner from './extent/Corner.js';
import Relationship from './extent/Relationship.js';


/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 * @typedef {Array<number>} Extent
 * @api
 */

/**
 * Build an extent that includes all given coordinates.
 *
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @return {Extent} Bounding extent.
 * @api
 */
export function boundingExtent(coordinates) {
  const extent = createEmpty();
  for (let i = 0, ii = coordinates.length; i < ii; ++i) {
    extendCoordinate(extent, coordinates[i]);
  }
  return extent;
}


/**
 * @param {Array<number>} xs Xs.
 * @param {Array<number>} ys Ys.
 * @param {Extent=} opt_extent Destination extent.
 * @private
 * @return {Extent} Extent.
 */
function _boundingExtentXYs(xs, ys, opt_extent) {
  const minX = Math.min.apply(null, xs);
  const minY = Math.min.apply(null, ys);
  const maxX = Math.max.apply(null, xs);
  const maxY = Math.max.apply(null, ys);
  return createOrUpdate(minX, minY, maxX, maxY, opt_extent);
}


/**
 * Return extent increased by the provided value.
 * @param {Extent} extent Extent.
 * @param {number} value The amount by which the extent should be buffered.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 * @api
 */
export function buffer(extent, value, opt_extent) {
  if (opt_extent) {
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
}


/**
 * Creates a clone of an extent.
 *
 * @param {Extent} extent Extent to clone.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} The clone.
 */
export function clone(extent, opt_extent) {
  if (opt_extent) {
    opt_extent[0] = extent[0];
    opt_extent[1] = extent[1];
    opt_extent[2] = extent[2];
    opt_extent[3] = extent[3];
    return opt_extent;
  } else {
    return extent.slice();
  }
}


/**
 * @param {Extent} extent Extent.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {number} Closest squared distance.
 */
export function closestSquaredDistanceXY(extent, x, y) {
  let dx, dy;
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
}


/**
 * Check if the passed coordinate is contained or on the edge of the extent.
 *
 * @param {Extent} extent Extent.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @return {boolean} The coordinate is contained in the extent.
 * @api
 */
export function containsCoordinate(extent, coordinate) {
  return containsXY(extent, coordinate[0], coordinate[1]);
}


/**
 * Check if one extent contains another.
 *
 * An extent is deemed contained if it lies completely within the other extent,
 * including if they share one or more edges.
 *
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {boolean} The second extent is contained by or on the edge of the
 *     first.
 * @api
 */
export function containsExtent(extent1, extent2) {
  return extent1[0] <= extent2[0] && extent2[2] <= extent1[2] &&
      extent1[1] <= extent2[1] && extent2[3] <= extent1[3];
}


/**
 * Check if the passed coordinate is contained or on the edge of the extent.
 *
 * @param {Extent} extent Extent.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {boolean} The x, y values are contained in the extent.
 * @api
 */
export function containsXY(extent, x, y) {
  return extent[0] <= x && x <= extent[2] && extent[1] <= y && y <= extent[3];
}


/**
 * Get the relationship between a coordinate and extent.
 * @param {Extent} extent The extent.
 * @param {import("./coordinate.js").Coordinate} coordinate The coordinate.
 * @return {Relationship} The relationship (bitwise compare with
 *     import("./extent/Relationship.js").Relationship).
 */
export function coordinateRelationship(extent, coordinate) {
  const minX = extent[0];
  const minY = extent[1];
  const maxX = extent[2];
  const maxY = extent[3];
  const x = coordinate[0];
  const y = coordinate[1];
  let relationship = Relationship.UNKNOWN;
  if (x < minX) {
    relationship = relationship | Relationship.LEFT;
  } else if (x > maxX) {
    relationship = relationship | Relationship.RIGHT;
  }
  if (y < minY) {
    relationship = relationship | Relationship.BELOW;
  } else if (y > maxY) {
    relationship = relationship | Relationship.ABOVE;
  }
  if (relationship === Relationship.UNKNOWN) {
    relationship = Relationship.INTERSECTING;
  }
  return relationship;
}


/**
 * Create an empty extent.
 * @return {Extent} Empty extent.
 * @api
 */
export function createEmpty() {
  return [Infinity, Infinity, -Infinity, -Infinity];
}


/**
 * Create a new extent or update the provided extent.
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {Extent=} opt_extent Destination extent.
 * @return {Extent} Extent.
 */
export function createOrUpdate(minX, minY, maxX, maxY, opt_extent) {
  if (opt_extent) {
    opt_extent[0] = minX;
    opt_extent[1] = minY;
    opt_extent[2] = maxX;
    opt_extent[3] = maxY;
    return opt_extent;
  } else {
    return [minX, minY, maxX, maxY];
  }
}


/**
 * Create a new empty extent or make the provided one empty.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
export function createOrUpdateEmpty(opt_extent) {
  return createOrUpdate(
    Infinity, Infinity, -Infinity, -Infinity, opt_extent);
}


/**
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
export function createOrUpdateFromCoordinate(coordinate, opt_extent) {
  const x = coordinate[0];
  const y = coordinate[1];
  return createOrUpdate(x, y, x, y, opt_extent);
}


/**
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
export function createOrUpdateFromCoordinates(coordinates, opt_extent) {
  const extent = createOrUpdateEmpty(opt_extent);
  return extendCoordinates(extent, coordinates);
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
export function createOrUpdateFromFlatCoordinates(flatCoordinates, offset, end, stride, opt_extent) {
  const extent = createOrUpdateEmpty(opt_extent);
  return extendFlatCoordinates(extent, flatCoordinates, offset, end, stride);
}

/**
 * @param {Array<Array<import("./coordinate.js").Coordinate>>} rings Rings.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
export function createOrUpdateFromRings(rings, opt_extent) {
  const extent = createOrUpdateEmpty(opt_extent);
  return extendRings(extent, rings);
}


/**
 * Determine if two extents are equivalent.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {boolean} The two extents are equivalent.
 * @api
 */
export function equals(extent1, extent2) {
  return extent1[0] == extent2[0] && extent1[2] == extent2[2] &&
      extent1[1] == extent2[1] && extent1[3] == extent2[3];
}


/**
 * Modify an extent to include another extent.
 * @param {Extent} extent1 The extent to be modified.
 * @param {Extent} extent2 The extent that will be included in the first.
 * @return {Extent} A reference to the first (extended) extent.
 * @api
 */
export function extend(extent1, extent2) {
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
}


/**
 * @param {Extent} extent Extent.
 * @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
 */
export function extendCoordinate(extent, coordinate) {
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
}


/**
 * @param {Extent} extent Extent.
 * @param {Array<import("./coordinate.js").Coordinate>} coordinates Coordinates.
 * @return {Extent} Extent.
 */
export function extendCoordinates(extent, coordinates) {
  for (let i = 0, ii = coordinates.length; i < ii; ++i) {
    extendCoordinate(extent, coordinates[i]);
  }
  return extent;
}


/**
 * @param {Extent} extent Extent.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {Extent} Extent.
 */
export function extendFlatCoordinates(extent, flatCoordinates, offset, end, stride) {
  for (; offset < end; offset += stride) {
    extendXY(extent, flatCoordinates[offset], flatCoordinates[offset + 1]);
  }
  return extent;
}


/**
 * @param {Extent} extent Extent.
 * @param {Array<Array<import("./coordinate.js").Coordinate>>} rings Rings.
 * @return {Extent} Extent.
 */
export function extendRings(extent, rings) {
  for (let i = 0, ii = rings.length; i < ii; ++i) {
    extendCoordinates(extent, rings[i]);
  }
  return extent;
}


/**
 * @param {Extent} extent Extent.
 * @param {number} x X.
 * @param {number} y Y.
 */
export function extendXY(extent, x, y) {
  extent[0] = Math.min(extent[0], x);
  extent[1] = Math.min(extent[1], y);
  extent[2] = Math.max(extent[2], x);
  extent[3] = Math.max(extent[3], y);
}


/**
 * This function calls `callback` for each corner of the extent. If the
 * callback returns a truthy value the function returns that value
 * immediately. Otherwise the function returns `false`.
 * @param {Extent} extent Extent.
 * @param {function(import("./coordinate.js").Coordinate): S} callback Callback.
 * @return {S|boolean} Value.
 * @template S
 */
export function forEachCorner(extent, callback) {
  let val;
  val = callback(getBottomLeft(extent));
  if (val) {
    return val;
  }
  val = callback(getBottomRight(extent));
  if (val) {
    return val;
  }
  val = callback(getTopRight(extent));
  if (val) {
    return val;
  }
  val = callback(getTopLeft(extent));
  if (val) {
    return val;
  }
  return false;
}


/**
 * Get the size of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Area.
 * @api
 */
export function getArea(extent) {
  let area = 0;
  if (!isEmpty(extent)) {
    area = getWidth(extent) * getHeight(extent);
  }
  return area;
}


/**
 * Get the bottom left coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Bottom left coordinate.
 * @api
 */
export function getBottomLeft(extent) {
  return [extent[0], extent[1]];
}


/**
 * Get the bottom right coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Bottom right coordinate.
 * @api
 */
export function getBottomRight(extent) {
  return [extent[2], extent[1]];
}


/**
 * Get the center coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Center.
 * @api
 */
export function getCenter(extent) {
  return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
}


/**
 * Get a corner coordinate of an extent.
 * @param {Extent} extent Extent.
 * @param {Corner} corner Corner.
 * @return {import("./coordinate.js").Coordinate} Corner coordinate.
 */
export function getCorner(extent, corner) {
  let coordinate;
  if (corner === Corner.BOTTOM_LEFT) {
    coordinate = getBottomLeft(extent);
  } else if (corner === Corner.BOTTOM_RIGHT) {
    coordinate = getBottomRight(extent);
  } else if (corner === Corner.TOP_LEFT) {
    coordinate = getTopLeft(extent);
  } else if (corner === Corner.TOP_RIGHT) {
    coordinate = getTopRight(extent);
  } else {
    assert(false, 13); // Invalid corner
  }
  return coordinate;
}


/**
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {number} Enlarged area.
 */
export function getEnlargedArea(extent1, extent2) {
  const minX = Math.min(extent1[0], extent2[0]);
  const minY = Math.min(extent1[1], extent2[1]);
  const maxX = Math.max(extent1[2], extent2[2]);
  const maxY = Math.max(extent1[3], extent2[3]);
  return (maxX - minX) * (maxY - minY);
}


/**
 * @param {import("./coordinate.js").Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {import("./size.js").Size} size Size.
 * @param {Extent=} opt_extent Destination extent.
 * @return {Extent} Extent.
 */
export function getForViewAndSize(center, resolution, rotation, size, opt_extent) {
  const dx = resolution * size[0] / 2;
  const dy = resolution * size[1] / 2;
  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);
  const xCos = dx * cosRotation;
  const xSin = dx * sinRotation;
  const yCos = dy * cosRotation;
  const ySin = dy * sinRotation;
  const x = center[0];
  const y = center[1];
  const x0 = x - xCos + ySin;
  const x1 = x - xCos - ySin;
  const x2 = x + xCos - ySin;
  const x3 = x + xCos + ySin;
  const y0 = y - xSin - yCos;
  const y1 = y - xSin + yCos;
  const y2 = y + xSin + yCos;
  const y3 = y + xSin - yCos;
  return createOrUpdate(
    Math.min(x0, x1, x2, x3), Math.min(y0, y1, y2, y3),
    Math.max(x0, x1, x2, x3), Math.max(y0, y1, y2, y3),
    opt_extent);
}


/**
 * Get the height of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Height.
 * @api
 */
export function getHeight(extent) {
  return extent[3] - extent[1];
}


/**
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @return {number} Intersection area.
 */
export function getIntersectionArea(extent1, extent2) {
  const intersection = getIntersection(extent1, extent2);
  return getArea(intersection);
}


/**
 * Get the intersection of two extents.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent 2.
 * @param {Extent=} opt_extent Optional extent to populate with intersection.
 * @return {Extent} Intersecting extent.
 * @api
 */
export function getIntersection(extent1, extent2, opt_extent) {
  const intersection = opt_extent ? opt_extent : createEmpty();
  if (intersects(extent1, extent2)) {
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
  } else {
    createOrUpdateEmpty(intersection);
  }
  return intersection;
}


/**
 * @param {Extent} extent Extent.
 * @return {number} Margin.
 */
export function getMargin(extent) {
  return getWidth(extent) + getHeight(extent);
}


/**
 * Get the size (width, height) of an extent.
 * @param {Extent} extent The extent.
 * @return {import("./size.js").Size} The extent size.
 * @api
 */
export function getSize(extent) {
  return [extent[2] - extent[0], extent[3] - extent[1]];
}


/**
 * Get the top left coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Top left coordinate.
 * @api
 */
export function getTopLeft(extent) {
  return [extent[0], extent[3]];
}


/**
 * Get the top right coordinate of an extent.
 * @param {Extent} extent Extent.
 * @return {import("./coordinate.js").Coordinate} Top right coordinate.
 * @api
 */
export function getTopRight(extent) {
  return [extent[2], extent[3]];
}


/**
 * Get the width of an extent.
 * @param {Extent} extent Extent.
 * @return {number} Width.
 * @api
 */
export function getWidth(extent) {
  return extent[2] - extent[0];
}


/**
 * Determine if one extent intersects another.
 * @param {Extent} extent1 Extent 1.
 * @param {Extent} extent2 Extent.
 * @return {boolean} The two extents intersect.
 * @api
 */
export function intersects(extent1, extent2) {
  return extent1[0] <= extent2[2] &&
      extent1[2] >= extent2[0] &&
      extent1[1] <= extent2[3] &&
      extent1[3] >= extent2[1];
}


/**
 * Determine if an extent is empty.
 * @param {Extent} extent Extent.
 * @return {boolean} Is empty.
 * @api
 */
export function isEmpty(extent) {
  return extent[2] < extent[0] || extent[3] < extent[1];
}


/**
 * @param {Extent} extent Extent.
 * @param {Extent=} opt_extent Extent.
 * @return {Extent} Extent.
 */
export function returnOrUpdate(extent, opt_extent) {
  if (opt_extent) {
    opt_extent[0] = extent[0];
    opt_extent[1] = extent[1];
    opt_extent[2] = extent[2];
    opt_extent[3] = extent[3];
    return opt_extent;
  } else {
    return extent;
  }
}


/**
 * @param {Extent} extent Extent.
 * @param {number} value Value.
 */
export function scaleFromCenter(extent, value) {
  const deltaX = ((extent[2] - extent[0]) / 2) * (value - 1);
  const deltaY = ((extent[3] - extent[1]) / 2) * (value - 1);
  extent[0] -= deltaX;
  extent[2] += deltaX;
  extent[1] -= deltaY;
  extent[3] += deltaY;
}


/**
 * Determine if the segment between two coordinates intersects (crosses,
 * touches, or is contained by) the provided extent.
 * @param {Extent} extent The extent.
 * @param {import("./coordinate.js").Coordinate} start Segment start coordinate.
 * @param {import("./coordinate.js").Coordinate} end Segment end coordinate.
 * @return {boolean} The segment intersects the extent.
 */
export function intersectsSegment(extent, start, end) {
  let intersects = false;
  const startRel = coordinateRelationship(extent, start);
  const endRel = coordinateRelationship(extent, end);
  if (startRel === Relationship.INTERSECTING ||
      endRel === Relationship.INTERSECTING) {
    intersects = true;
  } else {
    const minX = extent[0];
    const minY = extent[1];
    const maxX = extent[2];
    const maxY = extent[3];
    const startX = start[0];
    const startY = start[1];
    const endX = end[0];
    const endY = end[1];
    const slope = (endY - startY) / (endX - startX);
    let x, y;
    if (!!(endRel & Relationship.ABOVE) &&
        !(startRel & Relationship.ABOVE)) {
      // potentially intersects top
      x = endX - ((endY - maxY) / slope);
      intersects = x >= minX && x <= maxX;
    }
    if (!intersects && !!(endRel & Relationship.RIGHT) &&
        !(startRel & Relationship.RIGHT)) {
      // potentially intersects right
      y = endY - ((endX - maxX) * slope);
      intersects = y >= minY && y <= maxY;
    }
    if (!intersects && !!(endRel & Relationship.BELOW) &&
        !(startRel & Relationship.BELOW)) {
      // potentially intersects bottom
      x = endX - ((endY - minY) / slope);
      intersects = x >= minX && x <= maxX;
    }
    if (!intersects && !!(endRel & Relationship.LEFT) &&
        !(startRel & Relationship.LEFT)) {
      // potentially intersects left
      y = endY - ((endX - minX) * slope);
      intersects = y >= minY && y <= maxY;
    }

  }
  return intersects;
}


/**
 * Apply a transform function to the extent.
 * @param {Extent} extent Extent.
 * @param {import("./proj.js").TransformFunction} transformFn Transform function.
 * Called with `[minX, minY, maxX, maxY]` extent coordinates.
 * @param {Extent=} opt_extent Destination extent.
 * @return {Extent} Extent.
 * @api
 */
export function applyTransform(extent, transformFn, opt_extent) {
  const coordinates = [
    extent[0], extent[1],
    extent[0], extent[3],
    extent[2], extent[1],
    extent[2], extent[3]
  ];
  transformFn(coordinates, coordinates, 2);
  const xs = [coordinates[0], coordinates[2], coordinates[4], coordinates[6]];
  const ys = [coordinates[1], coordinates[3], coordinates[5], coordinates[7]];
  return _boundingExtentXYs(xs, ys, opt_extent);
}
