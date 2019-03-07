/**
 * @module ol/geom/flat/topology
 */
import {linearRing as linearRingArea} from './area.js';

/**
 * Check if the linestring is a boundary.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {boolean} The linestring is a boundary.
 */
export function lineStringIsClosed(flatCoordinates, offset, end, stride) {
  const lastCoord = end - stride;
  if (flatCoordinates[offset] === flatCoordinates[lastCoord] &&
      flatCoordinates[offset + 1] === flatCoordinates[lastCoord + 1] && (end - offset) / stride > 3) {
    return !!linearRingArea(flatCoordinates, offset, end, stride);
  }
  return false;
}
