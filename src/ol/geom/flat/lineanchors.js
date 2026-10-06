/**
 * @module ol/geom/flat/lineanchors
 */
import {lerp} from '../../math.js';
import {lineStringLength} from './length.js';

/**
 * Compute evenly-spaced anchor points along a line (or ring), without allocating
 * per-chunk coordinate arrays. The number of anchors is the closest whole number of
 * `chunkLength`-sized intervals that fit the line's total length, so spacing is always
 * even (no short leftover interval at the end).
 * @param {number} chunkLength Nominal length of each interval.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Start offset of the `flatCoordinates`.
 * @param {number} end End offset of the `flatCoordinates`.
 * @param {number} stride Stride.
 * @param {boolean|undefined} withRotation Also compute each anchor's tangent rotation,
 * from the start/end of its own interval.
 * @return {Array<number>} Flat `[x0, y0, x1, y1, ...]`, or when `withRotation` is `true`,
 * flat `[x0, y0, rotation0, x1, y1, rotation1, ...]`.
 */
export function lineAnchors(
  chunkLength,
  flatCoordinates,
  offset,
  end,
  stride,
  withRotation,
) {
  const totalLength = lineStringLength(flatCoordinates, offset, end, stride);
  const count = Math.max(1, Math.round(totalLength / chunkLength));
  const interval = totalLength / count / 2;

  const result = [];
  let cursor = offset;
  let x1 = flatCoordinates[offset];
  let y1 = flatCoordinates[offset + 1];
  let traveled = 0;

  let intervalStartX = x1;
  let intervalStartY = y1;
  let midX = x1;
  let midY = y1;

  const boundaryCount = count * 2;
  for (let k = 1; k <= boundaryCount; ++k) {
    let boundaryX, boundaryY;
    if (k === boundaryCount) {
      // avoid floating point drift: the final boundary is exactly the line's end
      boundaryX = flatCoordinates[end - stride];
      boundaryY = flatCoordinates[end - stride + 1];
    } else {
      while (true) {
        const x2 = flatCoordinates[cursor + stride];
        const y2 = flatCoordinates[cursor + stride + 1];
        const segmentLength = Math.sqrt(
          (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1),
        );
        if (traveled + segmentLength >= interval) {
          const m =
            segmentLength === 0 ? 1 : (interval - traveled) / segmentLength;
          if (m >= 1) {
            cursor += stride;
            x1 = x2;
            y1 = y2;
            boundaryX = x2;
            boundaryY = y2;
          } else {
            boundaryX = lerp(x1, x2, m);
            boundaryY = lerp(y1, y2, m);
            x1 = boundaryX;
            y1 = boundaryY;
          }
          traveled = 0;
          break;
        }
        traveled += segmentLength;
        cursor += stride;
        x1 = x2;
        y1 = y2;
      }
    }

    if (k % 2 === 1) {
      // odd boundary: arc-length midpoint of the current interval
      midX = boundaryX;
      midY = boundaryY;
    } else {
      // even boundary: end of the current interval
      if (withRotation) {
        // the y axis is flipped between map coordinates and canvas pixels
        const rotation = Math.atan2(
          intervalStartY - boundaryY,
          boundaryX - intervalStartX,
        );
        result.push(midX, midY, rotation);
      } else {
        result.push(midX, midY);
      }
      intervalStartX = boundaryX;
      intervalStartY = boundaryY;
    }
  }

  return result;
}
