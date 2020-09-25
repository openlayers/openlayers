/**
 * @module ol/geom/flat/textpath
 */
import {lerp} from '../../math.js';
import {rotate} from './transform.js';

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
 * @param {number} rotation Rotation to apply to the flatCoordinates to determine whether text needs to be reversed.
 * @return {Array<Array<*>>} The result array (or null if `maxAngle` was
 * exceeded). Entries of the array are x, y, anchorX, angle, chunk.
 */
export function drawTextOnPath(
  flatCoordinates,
  offset,
  end,
  stride,
  text,
  startM,
  maxAngle,
  scale,
  measureAndCacheTextWidth,
  font,
  cache,
  rotation
) {
  let x2 = flatCoordinates[offset];
  let y2 = flatCoordinates[offset + 1];
  let x1 = 0;
  let y1 = 0;
  let segmentLength = 0;
  let segmentM = 0;

  function advance() {
    x1 = x2;
    y1 = y2;
    offset += stride;
    x2 = flatCoordinates[offset];
    y2 = flatCoordinates[offset + 1];
    segmentM += segmentLength;
    segmentLength = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }
  do {
    advance();
  } while (offset < end - stride && segmentM + segmentLength < startM);

  let interpolate = (startM - segmentM) / segmentLength;
  const beginX = lerp(x1, x2, interpolate);
  const beginY = lerp(y1, y2, interpolate);

  const startOffset = offset - stride;
  const startLength = segmentM;
  const endM = startM + measureAndCacheTextWidth(font, text, cache);
  while (offset < end - stride && segmentM + segmentLength < endM) {
    advance();
  }
  interpolate = (endM - segmentM) / segmentLength;
  const endX = lerp(x1, x2, interpolate);
  const endY = lerp(y1, y2, interpolate);

  // Keep text upright
  let reverse;
  if (rotation) {
    const flat = [beginX, beginY, endX, endY];
    rotate(flat, 0, 4, 2, rotation, flat, flat);
    reverse = flat[0] > flat[2];
  } else {
    reverse = beginX > endX;
  }

  offset = startOffset;
  segmentLength = 0;
  segmentM = startLength;
  x2 = flatCoordinates[offset];
  y2 = flatCoordinates[offset + 1];
  advance();
  let angleChanged = false;

  const PI = Math.PI;
  const result = [];
  let previousAngle = Math.atan2(y2 - y1, x2 - x1);
  if (reverse) {
    previousAngle += previousAngle > 0 ? -PI : PI;
  }
  for (let i = 0, ii = text.length; i < ii; ++i) {
    const index = reverse ? ii - i - 1 : i;
    const char = text[index];
    const charLength = scale * measureAndCacheTextWidth(font, char, cache);
    const charM = startM + charLength / 2;
    while (offset < end - stride && segmentM + segmentLength < charM) {
      advance();
      let angle = Math.atan2(y2 - y1, x2 - x1);
      if (reverse) {
        angle += angle > 0 ? -PI : PI;
      }
      if (previousAngle !== undefined && angle !== previousAngle) {
        let delta = angle - previousAngle;
        delta += delta > PI ? -2 * PI : delta < -PI ? 2 * PI : 0;
        if (Math.abs(delta) > maxAngle) {
          return null;
        }
        angleChanged = true;
      }
      previousAngle = angle;
    }
    interpolate = (charM - segmentM) / segmentLength;
    const x = lerp(x1, x2, interpolate);
    const y = lerp(y1, y2, interpolate);
    result[index] = [x, y, charLength / 2, previousAngle, char];
    startM += charLength;
  }
  return angleChanged
    ? result
    : [[result[0][0], result[0][1], result[0][2], result[0][3], text]];
}
