/**
 * @module ol/geom/flat/clip
 */

/**
 * Start parameter of the portion of the last clipped segment that is inside the
 * extent. Set by {@link clipSegment}, read right after a `true` return to avoid
 * allocating a result array per segment.
 * @type {number}
 */
let clipSegmentStart = 0;

/**
 * End parameter of the portion of the last clipped segment that is inside the
 * extent. See {@link clipSegmentStart}.
 * @type {number}
 */
let clipSegmentEnd = 1;

/**
 * Clip a segment to a rectangular extent. On a `true` return, the inside
 * portion is `[clipSegmentStart, clipSegmentEnd]` in segment parameters. No
 * allocations are made, so the result globals must be read before the next
 * call.
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 * @param {number} x0 Segment start X.
 * @param {number} y0 Segment start Y.
 * @param {number} x1 Segment end X.
 * @param {number} y1 Segment end Y.
 * @return {boolean} The segment intersects the extent.
 */
function clipSegment(minX, minY, maxX, maxY, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let t0 = 0;
  let t1 = 1;

  // X slab.
  if (dx === 0) {
    if (x0 < minX || x0 > maxX) {
      return false;
    }
  } else {
    let ta = (minX - x0) / dx;
    let tb = (maxX - x0) / dx;
    if (ta > tb) {
      const tmp = ta;
      ta = tb;
      tb = tmp;
    }
    if (ta > t0) {
      t0 = ta;
    }
    if (tb < t1) {
      t1 = tb;
    }
    if (t0 > t1) {
      return false;
    }
  }

  // Y slab.
  if (dy === 0) {
    if (y0 < minY || y0 > maxY) {
      return false;
    }
  } else {
    let ta = (minY - y0) / dy;
    let tb = (maxY - y0) / dy;
    if (ta > tb) {
      const tmp = ta;
      ta = tb;
      tb = tmp;
    }
    if (ta > t0) {
      t0 = ta;
    }
    if (tb < t1) {
      t1 = tb;
    }
    if (t0 > t1) {
      return false;
    }
  }

  clipSegmentStart = t0;
  clipSegmentEnd = t1;
  return true;
}

/**
 * Clip flat line strings to the given extent. Parts outside the extent are
 * dropped and a vertex is inserted where a segment crosses the boundary. A line
 * that leaves and re-enters the extent is split into separate parts so that
 * positions derived from the result (e.g. labels placed along the line) stay
 * within the extent. Output coordinates have a stride of 2.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {import("../../extent.js").Extent} extent Extent to clip to.
 * @return {{flatCoordinates: Array<number>, ends: Array<number>}} Clipped flat
 *     coordinates and ends.
 */
export function clipFlatLineStrings(flatCoordinates, ends, stride, extent) {
  const minX = extent[0];
  const minY = extent[1];
  const maxX = extent[2];
  const maxY = extent[3];
  const dest = [];
  const destEnds = [];
  let open = false;
  let lastX, lastY;
  let offset = 0;
  for (let e = 0, ee = ends.length; e < ee; ++e) {
    const end = ends[e];
    let prevX = flatCoordinates[offset];
    let prevY = flatCoordinates[offset + 1];
    let lineHasLast = false;
    for (let i = offset + stride; i < end; i += stride) {
      const curX = flatCoordinates[i];
      const curY = flatCoordinates[i + 1];
      if (clipSegment(minX, minY, maxX, maxY, prevX, prevY, curX, curY)) {
        const dx = curX - prevX;
        const dy = curY - prevY;
        const ax = prevX + clipSegmentStart * dx;
        const ay = prevY + clipSegmentStart * dy;
        const bx = prevX + clipSegmentEnd * dx;
        const by = prevY + clipSegmentEnd * dy;
        if (open && lineHasLast && ax === lastX && ay === lastY) {
          dest.push(bx, by);
        } else {
          if (open) {
            destEnds.push(dest.length);
          }
          dest.push(ax, ay, bx, by);
          open = true;
        }
        lastX = bx;
        lastY = by;
        lineHasLast = true;
      }
      prevX = curX;
      prevY = curY;
    }
    offset = end;
  }
  if (open) {
    destEnds.push(dest.length);
  }
  return {flatCoordinates: dest, ends: destEnds};
}
