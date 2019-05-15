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
 * @return {Array<Array<*>>} The result array (or null if `maxAngle` was
 * exceeded). Entries of the array are x, y, anchorX, angle, chunk.
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
  let angleChanged = false;

  let index, previousAngle;
  for (let i = 0; i < numChars; ++i) {
    index = reverse ? numChars - i - 1 : i;
    const char = text[index];
    const charLength = scale * measureAndCacheTextWidth(font, char, cache);
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
      angleChanged = angleChanged || delta !== 0;
      delta += (delta > Math.PI) ? -2 * Math.PI : (delta < -Math.PI) ? 2 * Math.PI : 0;
      if (Math.abs(delta) > maxAngle) {
        return null;
      }
    }
    previousAngle = angle;
    const interpolate = segmentPos / segmentLength;
    const x = lerp(x1, x2, interpolate);
    const y = lerp(y1, y2, interpolate);
    result[index] = [x, y, charLength / 2, angle, char];
    startM += charLength;
  }
  return angleChanged ? result : [[result[0][0], result[0][1], result[0][2], result[0][3], text]];
}
