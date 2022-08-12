/**
 * @module ol/size
 */

/**
 * An array of numbers representing a size: `[width, height]`.
 * @typedef {Array<number>} Size
 * @api
 */

/**
 * Returns a buffered size.
 * @param {Size} size Size.
 * @param {number} num The amount by which to buffer.
 * @param {Size} [dest] Optional reusable size array.
 * @return {Size} The buffered size.
 */
export function buffer(size, num, dest) {
  if (dest === undefined) {
    dest = [0, 0];
  }
  dest[0] = size[0] + 2 * num;
  dest[1] = size[1] + 2 * num;
  return dest;
}

/**
 * Determines if a size has a positive area.
 * @param {Size} size The size to test.
 * @return {boolean} The size has a positive area.
 */
export function hasArea(size) {
  return size[0] > 0 && size[1] > 0;
}

/**
 * Returns a size scaled by a ratio. The result will be an array of integers.
 * @param {Size} size Size.
 * @param {number} ratio Ratio.
 * @param {Size} [dest] Optional reusable size array.
 * @return {Size} The scaled size.
 */
export function scale(size, ratio, dest) {
  if (dest === undefined) {
    dest = [0, 0];
  }
  dest[0] = (size[0] * ratio + 0.5) | 0;
  dest[1] = (size[1] * ratio + 0.5) | 0;
  return dest;
}

/**
 * Returns an `Size` array for the passed in number (meaning: square) or
 * `Size` array.
 * (meaning: non-square),
 * @param {number|Size} size Width and height.
 * @param {Size} [dest] Optional reusable size array.
 * @return {Size} Size.
 * @api
 */
export function toSize(size, dest) {
  if (Array.isArray(size)) {
    return size;
  } else {
    if (dest === undefined) {
      dest = [size, size];
    } else {
      dest[0] = size;
      dest[1] = size;
    }
    return dest;
  }
}
