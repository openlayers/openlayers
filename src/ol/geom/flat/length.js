/**
 * @module ol/geom/flat/length
 */


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} Length.
 */
export function lineStringLength(flatCoordinates, offset, end, stride) {
  let x1 = flatCoordinates[offset];
  let y1 = flatCoordinates[offset + 1];
  let length = 0;
  for (let i = offset + stride; i < end; i += stride) {
    const x2 = flatCoordinates[i];
    const y2 = flatCoordinates[i + 1];
    length += Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    x1 = x2;
    y1 = y2;
  }
  return length;
}


/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} Perimeter.
 */
export function linearRingLength(flatCoordinates, offset, end, stride) {
  let perimeter = lineStringLength(flatCoordinates, offset, end, stride);
  const dx = flatCoordinates[end - stride] - flatCoordinates[offset];
  const dy = flatCoordinates[end - stride + 1] - flatCoordinates[offset + 1];
  perimeter += Math.sqrt(dx * dx + dy * dy);
  return perimeter;
}
