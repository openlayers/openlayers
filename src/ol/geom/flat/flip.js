/**
 * @module ol/geom/flat/flip
 */

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array<number>=} opt_dest Destination.
 * @param {number=} opt_destOffset Destination offset.
 * @return {Array<number>} Flat coordinates.
 */
export function flipXY(
  flatCoordinates,
  offset,
  end,
  stride,
  opt_dest,
  opt_destOffset
) {
  let dest, destOffset;
  if (opt_dest !== undefined) {
    dest = opt_dest;
    destOffset = opt_destOffset !== undefined ? opt_destOffset : 0;
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
