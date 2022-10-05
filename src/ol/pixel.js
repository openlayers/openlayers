/**
 * @module ol/pixel
 */

/**
 * An array with two elements, representing a pixel. The first element is the
 * x-coordinate, the second the y-coordinate of the pixel.
 * @typedef {[number, number]} Pixel
 * @api
 */

/**
 * Create a copy of a pixel.
 * @param {Pixel} pixel Input pixel.
 * @return {Pixel} A new pixel with the same values as the input.
 */
export function clone(pixel) {
  return /** @type {Pixel} */ (pixel.slice());
}

/**
 * Create a pixel from the first two values of a coordinate.
 * @param {import("./coordinate.js").Coordinate} coordinate Input coordinate.
 * @return {Pixel} A pixel representing the coordinate.
 */
export function fromCoordinate(coordinate) {
  return /** @type {Pixel} */ (coordinate.slice(0, 2));
}
