/**
 * @module ol/geom/flat/flip
 */

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array<number>} [dest] Destination.
 * @param {number} [destOffset] Destination offset.
 * @return {Array<number>} Flat coordinates.
 */
export function flipXY(flatCoordinates, offset, end, stride, dest, destOffset) {
  if (dest !== undefined) {
    dest = dest;
    destOffset = destOffset !== undefined ? destOffset : 0;
  } else {
    dest = [];
    destOffset = 0;
  }
  let j = offset;
  while (j < end) {
    const x = flatCoordinates[j++];
    dest[destOffset++] = flatCoordinates[j++];
    dest[destOffset++] = x;
    for (let k = 2; k < stride; ++k) {
      dest[destOffset++] = flatCoordinates[j++];
    }
  }
  dest.length = destOffset;
  return dest;
}
