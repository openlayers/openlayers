/**
 * Removes consecutive duplicate coordinates from a flat coordinate array.
 *
 * @param {Array<number>} flatCoordinates Flat array of coordinates (e.g., [x1, y1, x2, y2, ...])
 * @param {number} stride Number of values per coordinate tuple (e.g., 2 for 2D, 3 for 3D)
 * @param {Array<number>} [dest] Destination array, here the result de-duplicated flat coordinates are written. It can be the same array as the flatCoordinates one.
 * @return {Array<number>} Deduplicated flat coordinates array
 */
export function deduplicateCoordinates(flatCoordinates, stride, dest) {
  dest = dest ?? [];

  let destIndex = 0;
  for (let i = 0; i < flatCoordinates.length; i += stride) {
    // Skip duplicate coordinates
    if (i !== 0 && coordinatesEqual(flatCoordinates, i, i - stride, stride)) {
      continue;
    }

    // Copy coordinate to destination
    for (let j = 0; j < stride; j++) {
      dest[destIndex + j] = flatCoordinates[i + j];
    }
    destIndex += stride;
  }
  dest.length = destIndex;

  return dest;
}

/**
 * Checks if 2 coordinates of the given indices in the flat coordinates array are equal.
 *
 * @param {Array<number>} flatCoordinates Flat array of coordinates (e.g., [x1, y1, x2, y2, ...])
 * @param {number} firstCoordinateIndex Starting index of the first coordinate to compare
 * @param {number} secondCoordinateIndex Starting index of the second coordinate to compare
 * @param {number} stride Number of values per coordinate tuple
 * @return {boolean} true if coordinates are same
 */
function coordinatesEqual(
  flatCoordinates,
  firstCoordinateIndex,
  secondCoordinateIndex,
  stride,
) {
  for (let j = 0; j < stride; j++) {
    if (
      flatCoordinates[firstCoordinateIndex + j] !==
      flatCoordinates[secondCoordinateIndex + j]
    ) {
      return false;
    }
  }
  return true;
}
