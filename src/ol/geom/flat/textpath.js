/**
 * @module ol/geom/flat/textpath
 */
import {lerp} from '../../math.js';


/**
 * @param {Array<number>} flatCoordinates Path to put text on.
 * @param {number} offset Start offset of the `flatCoordinates`.
 * @param {number} end End offset of the `flatCoordinates`.
 * @param {number} stride Stride.
 * @param {string} text Text to place on the path.
 * @param {number} startM m along the path where the text starts.
 * @param {number} maxAngle Max angle between adjacent chars in radians.
 * @param {number} scale The product of the text scale and the device pixel ratio.
 * @param {function(string, string, Object<string, number>):number} measureAndCacheTextWidth Measure and cache text width.
 * @param {string} font The font.
 * @param {Object<string, number>} cache A cache of measured widths.
 * @return {Array<Array<*>>} The result array of null if `maxAngle` was
 * exceeded. Entries of the array are x, y, anchorX, angle, chunk.
 */
export function drawTextOnPath(
  flatCoordinates, offset, end, stride, text, startM, maxAngle, scale, measureAndCacheTextWidth, font, cache) {
  const result = [];

  // Keep text upright
  const reverse = flatCoordinates[offset] > flatCoordinates[end - stride];

  const numChars = text.length;

  let x1 = flatCoordinates[offset];
  let y1 = flatCoordinates[offset + 1];
  offset += stride;
  let x2 = flatCoordinates[offset];
  let y2 = flatCoordinates[offset + 1];
  let segmentM = 0;
  let segmentLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

  let chunk = '';
  let chunkLength = 0;
  let data, index, previousAngle;
  for (let i = 0; i < numChars; ++i) {
    index = reverse ? numChars - i - 1 : i;
    const char = text.charAt(index);
    chunk = reverse ? char + chunk : chunk + char;
    const charLength = scale * measureAndCacheTextWidth(font, chunk, cache) - chunkLength;
    chunkLength += charLength;
    const charM = startM + charLength / 2;
    while (offset < end - stride && segmentM + segmentLength < charM) {
      x1 = x2;
      y1 = y2;
      offset += stride;
      x2 = flatCoordinates[offset];
      y2 = flatCoordinates[offset + 1];
      segmentM += segmentLength;
      segmentLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    const segmentPos = charM - segmentM;
    let angle = Math.atan2(y2 - y1, x2 - x1);
    if (reverse) {
      angle += angle > 0 ? -Math.PI : Math.PI;
    }
    if (previousAngle !== undefined) {
      let delta = angle - previousAngle;
      delta += (delta > Math.PI) ? -2 * Math.PI : (delta < -Math.PI) ? 2 * Math.PI : 0;
      if (Math.abs(delta) > maxAngle) {
        return null;
      }
    }
    const interpolate = segmentPos / segmentLength;
    const x = lerp(x1, x2, interpolate);
    const y = lerp(y1, y2, interpolate);
    if (previousAngle == angle) {
      if (reverse) {
        data[0] = x;
        data[1] = y;
        data[2] = charLength / 2;
      }
      data[4] = chunk;
    } else {
      chunk = char;
      chunkLength = charLength;
      data = [x, y, charLength / 2, angle, chunk];
      if (reverse) {
        result.unshift(data);
      } else {
        result.push(data);
      }
      previousAngle = angle;
    }
    startM += charLength;
  }
  return result;
}
