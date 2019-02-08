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
  const point1 = [flatCoordinates[offset], flatCoordinates[offset + 1]];
  const point2 = [];
  let ret;
  for (; (offset + stride) < end; offset += stride) {
    point2[0] = flatCoordinates[offset + stride];
    point2[1] = flatCoordinates[offset + stride + 1];
    ret = callback(point1, point2);
    if (ret) {
      return ret;
    }
    point1[0] = point2[0];
    point1[1] = point2[1];
  }
  return false;
}
