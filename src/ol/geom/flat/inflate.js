/**
 * @module ol/geom/flat/inflate
 */

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {Array<import("../../coordinate.js").Coordinate>} [opt_coordinates] Coordinates.
 * @return {Array<import("../../coordinate.js").Coordinate>} Coordinates.
 */
export function inflateCoordinates(
  flatCoordinates,
  offset,
  end,
  stride,
  opt_coordinates
) {
  const coordinates = opt_coordinates !== undefined ? opt_coordinates : [];
  let i = 0;
  for (let j = offset; j < end; j += stride) {
    coordinates[i++] = flatCoordinates.slice(j, j + stride);
  }
  coordinates.length = i;
  return coordinates;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {Array<Array<import("../../coordinate.js").Coordinate>>} [opt_coordinatess] Coordinatess.
 * @return {Array<Array<import("../../coordinate.js").Coordinate>>} Coordinatess.
 */
export function inflateCoordinatesArray(
  flatCoordinates,
  offset,
  ends,
  stride,
  opt_coordinatess
) {
  const coordinatess = opt_coordinatess !== undefined ? opt_coordinatess : [];
  let i = 0;
  for (let j = 0, jj = ends.length; j < jj; ++j) {
    const end = ends[j];
    coordinatess[i++] = inflateCoordinates(
      flatCoordinates,
      offset,
      end,
      stride,
      coordinatess[i]
    );
    offset = end;
  }
  coordinatess.length = i;
  return coordinatess;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {Array<Array<Array<import("../../coordinate.js").Coordinate>>>} [opt_coordinatesss]
 *     Coordinatesss.
 * @return {Array<Array<Array<import("../../coordinate.js").Coordinate>>>} Coordinatesss.
 */
export function inflateMultiCoordinatesArray(
  flatCoordinates,
  offset,
  endss,
  stride,
  opt_coordinatesss
) {
  const coordinatesss =
    opt_coordinatesss !== undefined ? opt_coordinatesss : [];
  let i = 0;
  for (let j = 0, jj = endss.length; j < jj; ++j) {
    const ends = endss[j];
    coordinatesss[i++] = inflateCoordinatesArray(
      flatCoordinates,
      offset,
      ends,
      stride,
      coordinatesss[i]
    );
    offset = ends[ends.length - 1];
  }
  coordinatesss.length = i;
  return coordinatesss;
}
