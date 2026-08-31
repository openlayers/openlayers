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

/**
 * Clip a linear ring to a rectangular extent (Sutherland–Hodgman).
 * The ring may be open or closed; the result is open (first ≠ last) with at
 * least three vertices, or empty if nothing remains inside the extent.
 *
 * @param {Array<number>|Float32Array} flatCoordinates Flat XY coordinates.
 * @param {import("../../extent.js").Extent} extent Clip rectangle.
 * @return {Array<number>} Clipped open ring, or empty array.
 */
export function clipFlatRingToExtent(flatCoordinates, extent) {
  const minX = extent[0];
  const minY = extent[1];
  const maxX = extent[2];
  const maxY = extent[3];

  /** @type {Array<number>} */
  let ring = Array.from(flatCoordinates);
  if (
    ring.length >= 6 &&
    ring[0] === ring[ring.length - 2] &&
    ring[1] === ring[ring.length - 1]
  ) {
    ring = ring.slice(0, -2);
  }
  if (ring.length < 6) {
    return [];
  }

  /**
   * @param {Array<number>} input Input ring (open, XY).
   * @param {function(number, number): boolean} inside Inside test for clip edge.
   * @param {function(number, number, number, number): Array<number>} intersect
   *     Segment ∩ clip edge → [x, y].
   * @return {Array<number>} Clipped ring.
   */
  function clipAgainstEdge(input, inside, intersect) {
    /** @type {Array<number>} */
    const output = [];
    const n = input.length / 2;
    if (n < 2) {
      return output;
    }
    for (let i = 0; i < n; ++i) {
      const x0 = input[i * 2];
      const y0 = input[i * 2 + 1];
      const x1 = input[((i + 1) % n) * 2];
      const y1 = input[((i + 1) % n) * 2 + 1];
      const in0 = inside(x0, y0);
      const in1 = inside(x1, y1);
      if (in0) {
        if (in1) {
          output.push(x1, y1);
        } else {
          output.push(...intersect(x0, y0, x1, y1));
        }
      } else if (in1) {
        output.push(...intersect(x0, y0, x1, y1), x1, y1);
      }
    }
    return output;
  }

  /**
   * @param {number} x0 X0.
   * @param {number} y0 Y0.
   * @param {number} x1 X1.
   * @param {number} y1 Y1.
   * @param {number} x X on vertical edge.
   * @return {Array<number>} Intersection.
   */
  function intersectVertical(x0, y0, x1, y1, x) {
    const t = (x - x0) / (x1 - x0);
    return [x, y0 + t * (y1 - y0)];
  }

  /**
   * @param {number} x0 X0.
   * @param {number} y0 Y0.
   * @param {number} x1 X1.
   * @param {number} y1 Y1.
   * @param {number} y Y on horizontal edge.
   * @return {Array<number>} Intersection.
   */
  function intersectHorizontal(x0, y0, x1, y1, y) {
    const t = (y - y0) / (y1 - y0);
    return [x0 + t * (x1 - x0), y];
  }

  ring = clipAgainstEdge(
    ring,
    (x) => x >= minX,
    (x0, y0, x1, y1) => intersectVertical(x0, y0, x1, y1, minX),
  );
  ring = clipAgainstEdge(
    ring,
    (x) => x <= maxX,
    (x0, y0, x1, y1) => intersectVertical(x0, y0, x1, y1, maxX),
  );
  ring = clipAgainstEdge(
    ring,
    (x, y) => y >= minY,
    (x0, y0, x1, y1) => intersectHorizontal(x0, y0, x1, y1, minY),
  );
  ring = clipAgainstEdge(
    ring,
    (x, y) => y <= maxY,
    (x0, y0, x1, y1) => intersectHorizontal(x0, y0, x1, y1, maxY),
  );

  return ring.length >= 6 ? ring : [];
}

/**
 * Clip a triangle to a rectangular extent. The triangle is convex, so
 * Sutherland–Hodgman yields a convex polygon; fan-triangulate it.
 *
 * @param {number} ax A.x
 * @param {number} ay A.y
 * @param {number} bx B.x
 * @param {number} by B.y
 * @param {number} cx C.x
 * @param {number} cy C.y
 * @param {import("../../extent.js").Extent} extent Clip rectangle.
 * @return {Array<number>} Flat XY triangles (groups of 6), or empty.
 */
export function clipFlatTriangleToExtent(ax, ay, bx, by, cx, cy, extent) {
  const clipped = clipFlatRingToExtent([ax, ay, bx, by, cx, cy], extent);
  const n = clipped.length / 2;
  if (n < 3) {
    return [];
  }
  /** @type {Array<number>} */
  const triangles = [];
  const x0 = clipped[0];
  const y0 = clipped[1];
  for (let i = 1; i < n - 1; ++i) {
    triangles.push(
      x0,
      y0,
      clipped[i * 2],
      clipped[i * 2 + 1],
      clipped[(i + 1) * 2],
      clipped[(i + 1) * 2 + 1],
    );
  }
  return triangles;
}
