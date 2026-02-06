/**
 * @module ol/geom/flat/segments
 */

/**
 * This function calls `callback` for each segment of the flat coordinates
 * array. If the callback returns a truthy value the function returns that
 * value immediately. Otherwise the function returns `false`.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {function(import("../../coordinate.js").Coordinate, import("../../coordinate.js").Coordinate): T} callback Function
 *     called for each segment.
 * @return {T|boolean} Value.
 * @template T
 */
export function forEach(flatCoordinates, offset, end, stride, callback) {
  let ret;
  offset += stride;
  for (; offset < end; offset += stride) {
    ret = callback(
      flatCoordinates.slice(offset - stride, offset),
      flatCoordinates.slice(offset, offset + stride),
    );
    if (ret) {
      return ret;
    }
  }
  return false;
}

/**
 * Calculate the intersection point of two line segments.
 * Reference: https://stackoverflow.com/a/72474223/2389327
 * @param {Array<import("../../coordinate.js").Coordinate>} segment1 The first line segment as an array of two points.
 * @param {Array<import("../../coordinate.js").Coordinate>} segment2 The second line segment as an array of two points.
 * @return {import("../../coordinate.js").Coordinate|undefined} The intersection point or `undefined` if no intersection.
 */
export function getIntersectionPoint(segment1, segment2) {
  const [a, b] = segment1;
  const [c, d] = segment2;
  const t =
    ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) /
    ((a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]));
  const u =
    ((a[0] - c[0]) * (a[1] - b[1]) - (a[1] - c[1]) * (a[0] - b[0])) /
    ((a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]));

  // Check if lines actually intersect
  if (0 <= t && t <= 1 && 0 <= u && u <= 1) {
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  }
  return undefined;
}
