/**
 * Utilities for encoding/decoding values to be used in shaders
 * @module ol/render/webgl/encodeUtil
 */

/**
 * Generates a color array based on a numerical id
 * Note: the range for each component is 0 to 1 with 256 steps
 * @param {number} id Id
 * @param {Array<number>} [array] Reusable array
 * @return {Array<number>} Color array containing the encoded id
 */
export function colorEncodeId(id, array) {
  array = array || [];
  const radix = 256;
  const divide = radix - 1;
  array[0] = Math.floor(id / radix / radix / radix) / divide;
  array[1] = (Math.floor(id / radix / radix) % radix) / divide;
  array[2] = (Math.floor(id / radix) % radix) / divide;
  array[3] = (id % radix) / divide;
  return array;
}

/**
 * Reads an id from a color-encoded array
 * Note: the expected range for each component is 0 to 1 with 256 steps.
 * @param {Array<number>} color Color array containing the encoded id
 * @return {number} Decoded id
 */
export function colorDecodeId(color) {
  let id = 0;
  const radix = 256;
  const mult = radix - 1;
  id += Math.round(color[0] * radix * radix * radix * mult);
  id += Math.round(color[1] * radix * radix * mult);
  id += Math.round(color[2] * radix * mult);
  id += Math.round(color[3] * mult);
  return id;
}
