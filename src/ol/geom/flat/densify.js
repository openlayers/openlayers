/**
 * @module ol/geom/flat/densify
 */

/**
 * Densify an XY flat coordinate array.
 * @param {Array<number>} flatCoordinates Flat XY coordinates.
 * @param {number} maxSegmentLength Max segment length in the same units.
 * @param {number} [maxSpanX] If > 0, do not subdivide segments with |Δx|
 * larger than this (antimeridian chords must stay whole so cut filters can
 * drop them — densifying the long way draws continent-spanning streaks).
 * @return {Array<number>} Densified flat coordinates (or the input if unchanged).
 */
export function densifyFlatCoordinates(
  flatCoordinates,
  maxSegmentLength,
  maxSpanX,
) {
  if (!(maxSegmentLength > 0) || flatCoordinates.length < 4) {
    return flatCoordinates;
  }
  /** @type {Array<number>} */
  const out = [flatCoordinates[0], flatCoordinates[1]];
  for (let i = 2; i < flatCoordinates.length; i += 2) {
    const x0 = out[out.length - 2];
    const y0 = out[out.length - 1];
    const x1 = flatCoordinates[i];
    const y1 = flatCoordinates[i + 1];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const spanBlocked = !!maxSpanX && Math.abs(dx) > maxSpanX;
    if (len > maxSegmentLength && !spanBlocked) {
      const n = Math.ceil(len / maxSegmentLength);
      for (let k = 1; k < n; ++k) {
        const t = k / n;
        out.push(x0 + dx * t, y0 + dy * t);
      }
    }
    out.push(x1, y1);
  }
  return out;
}
