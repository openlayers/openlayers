/**
 * @module ol/size
 */


/**
 * An array of numbers representing a size: `[width, height]`.
 * @typedef {Array.<number>} Size
 * @api
 */


/**
 * Returns a buffered size.
 * @param {module:ol/size~Size} size Size.
 * @param {number} num The amount by which to buffer.
 * @param {module:ol/size~Size=} opt_size Optional reusable size array.
 * @return {module:ol/size~Size} The buffered size.
 */
export function buffer(size, num, opt_size) {
  if (opt_size === undefined) {
    opt_size = [0, 0];
  }
  opt_size[0] = size[0] + 2 * num;
  opt_size[1] = size[1] + 2 * num;
  return opt_size;
}


/**
 * Determines if a size has a positive area.
 * @param {module:ol/size~Size} size The size to test.
 * @return {boolean} The size has a positive area.
 */
export function hasArea(size) {
  return size[0] > 0 && size[1] > 0;
}


/**
 * Returns a size scaled by a ratio. The result will be an array of integers.
 * @param {module:ol/size~Size} size Size.
 * @param {number} ratio Ratio.
 * @param {module:ol/size~Size=} opt_size Optional reusable size array.
 * @return {module:ol/size~Size} The scaled size.
 */
export function scale(size, ratio, opt_size) {
  if (opt_size === undefined) {
    opt_size = [0, 0];
  }
  opt_size[0] = (size[0] * ratio + 0.5) | 0;
  opt_size[1] = (size[1] * ratio + 0.5) | 0;
  return opt_size;
}


/**
 * Returns an `module:ol/size~Size` array for the passed in number (meaning: square) or
 * `module:ol/size~Size` array.
 * (meaning: non-square),
 * @param {number|module:ol/size~Size} size Width and height.
 * @param {module:ol/size~Size=} opt_size Optional reusable size array.
 * @return {module:ol/size~Size} Size.
 * @api
 */
export function toSize(size, opt_size) {
  if (Array.isArray(size)) {
    return size;
  } else {
    if (opt_size === undefined) {
      opt_size = [size, size];
    } else {
      opt_size[0] = opt_size[1] = /** @type {number} */ (size);
    }
    return opt_size;
  }
}
