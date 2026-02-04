/**
 * Utilities for encoding/decoding values to be used in shaders
 * @module ol/render/webgl/encodeUtil
 */

/**
 * Generates a color array based on a numerical id, and pack it just like the `packColor` function of 'ol/render/webgl/compileUtil.js'.
 * Note: the range for each component is 0 to 1 with 256 steps
 * @param {number} id Id
 * @param {Array<number>} [array] Reusable array
 * @return {Array<number>} Packed color array with two components
 */
export function colorEncodeIdAndPack(id, array) {
  array = array || [];
  const radix = 256;
  const divide = radix - 1;
  const r = Math.floor(id / radix / radix / radix) / divide;
  const g = (Math.floor(id / radix / radix) % radix) / divide;
  const b = (Math.floor(id / radix) % radix) / divide;
  const a = (id % radix) / divide;
  array[0] = r * 256 * 255 + g * 255;
  array[1] = b * 256 * 255 + a * 255;
  return array;
}

/**
 * Reads an id from a color-encoded array
 * Note: the expected range for each component is 0 to 1 with 256 steps.
 * @param {Array<number>} color Color array containing the encoded id; color components are in the range 0 to 1
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
