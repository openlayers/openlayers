/**
 * @module ol/geom/flat/area
 */


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} Area.
 */
export function linearRing(flatCoordinates, offset, end, stride) {
  let twiceArea = 0;
  let x1 = flatCoordinates[end - stride];
  let y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    const x2 = flatCoordinates[offset];
    const y2 = flatCoordinates[offset + 1];
    twiceArea += y1 * x2 - x1 * y2;
    x1 = x2;
    y1 = y2;
  }
  return twiceArea / 2;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @return {number} Area.
 */
export function linearRings(flatCoordinates, offset, ends, stride) {
  let area = 0;
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    area += linearRing(flatCoordinates, offset, end, stride);
    offset = end;
  }
  return area;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @return {number} Area.
 */
export function linearRingss(flatCoordinates, offset, endss, stride) {
  let area = 0;
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    area += linearRings(flatCoordinates, offset, ends, stride);
    offset = ends[ends.length - 1];
  }
  return area;
}
