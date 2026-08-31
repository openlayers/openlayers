/**
 * @module ol/render/webgpu/tessellate
 *
 * Polygon fill triangulation for WebGPU. When reprojecting, rings are clipped
 * to the extent being built, densified in source space, triangulated, and
 * edges that fold across a projection cut are dropped.
 */
import earcut from 'earcut';
import {
  clipFlatRingToExtent,
  clipFlatTriangleToExtent,
} from '../../geom/flat/clip.js';
import {densifyFlatCoordinates} from '../../geom/flat/densify.js';
import {warpGridSampler} from './warpGrid.js';

/**
 * @typedef {Object} TessellateOptions
 * @property {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} [projectToTarget]
 *     Source→target. When set, earcut runs on projected coordinates.
 * @property {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} [projectAnchorsToTarget]
 *     Source→target for label anchors only, used when geometry is warped on the GPU instead.
 * @property {import("../../extent.js").Extent} [clipExtent] Clip rings to this before triangulating.
 * @property {number} [maxSegmentLength] Densify source rings (source units).
 * @property {number} [maxSpanX] Do not densify source segments with |Δx| larger than this.
 * @property {number} [maxTargetEdge] Drop folding triangles whose target edges exceed this.
 * @property {number} [worldWidth] Source world width, for wrapping geometry into the grid.
 * @property {import("./warpGrid.js").WarpGrid} [warpGrid] Sampled projection the GPU will warp with.
 * @property {import("../../extent.js").Extent} [warpExtent] Source extent `warpGrid` covers.
 * @property {number} [maxTargetError] Target distance a straight triangle edge may stray by.
 */

/**
 * True when a long source edge is a projection cut (warp folds) rather than a
 * legitimate earcut diagonal. Smooth warps keep the midpoint near the chord;
 * antimeridian / UV-clamp streaks send it far away.
 *
 * @param {import("../../coordinate.js").Coordinate} sa Source A.
 * @param {import("../../coordinate.js").Coordinate} sb Source B.
 * @param {import("../../coordinate.js").Coordinate} ta Target A.
 * @param {import("../../coordinate.js").Coordinate} tb Target B.
 * @param {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} projectToTarget Source→target.
 * @param {number} edgeLenSq Squared target edge length.
 * @return {boolean} Edge crosses a cut.
 */
function targetEdgeCrossesCut(sa, sb, ta, tb, projectToTarget, edgeLenSq) {
  const mid = projectToTarget([(sa[0] + sb[0]) * 0.5, (sa[1] + sb[1]) * 0.5]);
  if (!mid) {
    return true;
  }
  const ex = (ta[0] + tb[0]) * 0.5;
  const ey = (ta[1] + tb[1]) * 0.5;
  const errX = mid[0] - ex;
  const errY = mid[1] - ey;
  return errX * errX + errY * errY > edgeLenSq * 0.25;
}

/**
 * Drop fill triangles that fold across a projection cut after warping.
 * Long smooth earcut diagonals (holes, concave rings) are kept.
 *
 * @param {Array<number>|Float32Array} sourceXY Source-space XY vertices.
 * @param {Array<number>|Uint32Array} indexArray Triangle indices.
 * @param {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} projectToTarget Source→target.
 * @param {number} maxEdge Max edge length in target units before cut-testing.
 * @return {Array<number>} Filtered triangle indices.
 */
export function filterTrianglesByTargetEdge(
  sourceXY,
  indexArray,
  projectToTarget,
  maxEdge,
) {
  if (!(maxEdge > 0) || !projectToTarget) {
    return Array.from(indexArray);
  }
  const maxEdgeSq = maxEdge * maxEdge;
  /** @type {Array<number>} */
  const out = [];
  for (let i = 0; i < indexArray.length; i += 3) {
    const i0 = indexArray[i];
    const i1 = indexArray[i + 1];
    const i2 = indexArray[i + 2];
    const sa = [sourceXY[i0 * 2], sourceXY[i0 * 2 + 1]];
    const sb = [sourceXY[i1 * 2], sourceXY[i1 * 2 + 1]];
    const sc = [sourceXY[i2 * 2], sourceXY[i2 * 2 + 1]];
    const a = projectToTarget(sa);
    const b = projectToTarget(sb);
    const c = projectToTarget(sc);
    if (!a || !b || !c) {
      continue;
    }
    const ab = (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]);
    const bc = (b[0] - c[0]) * (b[0] - c[0]) + (b[1] - c[1]) * (b[1] - c[1]);
    const ca = (c[0] - a[0]) * (c[0] - a[0]) + (c[1] - a[1]) * (c[1] - a[1]);
    const maxLenSq = Math.max(ab, bc, ca);
    if (
      maxLenSq > maxEdgeSq &&
      ((ab > maxEdgeSq &&
        targetEdgeCrossesCut(sa, sb, a, b, projectToTarget, ab)) ||
        (bc > maxEdgeSq &&
          targetEdgeCrossesCut(sb, sc, b, c, projectToTarget, bc)) ||
        (ca > maxEdgeSq &&
          targetEdgeCrossesCut(sc, sa, c, a, projectToTarget, ca)))
    ) {
      continue;
    }
    out.push(i0, i1, i2);
  }
  return out;
}

/**
 * Densify polygon rings independently and rebuild earcut hole indices.
 *
 * @param {Array<number>} xy Flat XY.
 * @param {Array<number>} holes Earcut hole vertex indices.
 * @param {number} maxSegmentLength Max segment length.
 * @param {number} [maxSpanX] Max |Δx| to densify.
 * @return {{flatCoordinates: Array<number>, holes: Array<number>}} Densified rings.
 */
export function densifyPolygonRings(xy, holes, maxSegmentLength, maxSpanX) {
  const ends = holes.slice();
  ends.push(xy.length / 2);
  /** @type {Array<number>} */
  const out = [];
  /** @type {Array<number>} */
  const newHoles = [];
  let start = 0;
  for (let r = 0; r < ends.length; ++r) {
    const end = ends[r];
    /** @type {Array<number>} */
    const ring = [];
    for (let i = start; i < end; ++i) {
      ring.push(xy[i * 2], xy[i * 2 + 1]);
    }
    const dense = densifyFlatCoordinates(ring, maxSegmentLength, maxSpanX);
    if (r > 0) {
      newHoles.push(out.length / 2);
    }
    // Appended one at a time: a ring that circles Antarctica densifies into
    // more numbers than a call can take arguments, and spreading it overflows
    // the stack.
    for (let i = 0; i < dense.length; ++i) {
      out.push(dense[i]);
    }
    start = end;
  }
  return {flatCoordinates: out, holes: newHoles};
}

/**
 * Clip a polygon's rings to an extent, keeping earcut's hole numbering.
 *
 * A ring that leaves nothing inside is dropped; if that ring is the outer one
 * the whole polygon goes, holes and all.
 *
 * @param {Array<number>} xy Flat XY in source space.
 * @param {Array<number>} holes Earcut hole vertex indices.
 * @param {import("../../extent.js").Extent} extent Clip extent.
 * @return {{flatCoordinates: Array<number>, holes: Array<number>}} Clipped rings.
 */
export function clipPolygonRings(xy, holes, extent) {
  const ends = holes.slice();
  ends.push(xy.length / 2);
  /** @type {Array<number>} */
  const out = [];
  /** @type {Array<number>} */
  const newHoles = [];
  let start = 0;
  for (let r = 0; r < ends.length; ++r) {
    const end = ends[r];
    /** @type {Array<number>} */
    const ring = [];
    for (let i = start; i < end; ++i) {
      ring.push(xy[i * 2], xy[i * 2 + 1]);
    }
    start = end;
    const clipped = clipFlatRingToExtent(ring, extent);
    if (clipped.length < 6) {
      if (r === 0) {
        return {flatCoordinates: [], holes: []};
      }
      continue;
    }
    if (r > 0) {
      newHoles.push(out.length / 2);
    }
    for (let i = 0; i < clipped.length; ++i) {
      out.push(clipped[i]);
    }
  }
  return {flatCoordinates: out, holes: newHoles};
}

/**
 * How far a triangle may be split before its remaining error is accepted. Each
 * level halves an edge and so quarters the gap between it and the projection,
 * which covers a chord that starts out a thousand pixels adrift.
 * @type {number}
 */
const MAX_REFINE_DEPTH = 6;

/**
 * Split triangles until their edges follow the projection, and drop the ones
 * that reach across a cut in it.
 *
 * Earcut joins vertices that are far apart in the ring — a hole to its outer
 * ring, or one side of a fan to the other. Those diagonals are straight in the
 * source projection but the GPU draws them straight in the target projection,
 * where the same line is a curve, so the triangle leaves the polygon and lands
 * on top of its neighbours as an opaque streak. Splitting an edge whose middle
 * strays from it brings the triangle back onto the curve. An edge across a cut
 * never converges, however far it is split, so it goes instead.
 *
 * @param {Array<number>} sourceXY Flat XY in source space.
 * @param {Array<number>|Uint32Array} indices Triangle indices.
 * @param {function(number, number, Array<number>): boolean} sample Source to target.
 * @param {number} maxError Target distance a straight edge may stray by.
 * @param {number} maxEdge Target distance that means an edge crosses a cut.
 * @return {{flatCoordinates: Array<number>, indices: Array<number>}} Refined mesh.
 */
export function refineTriangles(sourceXY, indices, sample, maxError, maxEdge) {
  const source = Array.from(sourceXY);
  /** @type {Array<number>} */
  const target = [];
  /** @type {Array<boolean>} */
  const usable = [];
  const point = [0, 0];
  for (let i = 0; i < source.length; i += 2) {
    const ok = sample(source[i], source[i + 1], point);
    usable.push(ok);
    target.push(point[0], point[1]);
  }

  /**
   * Both triangles either side of an edge split it at the same place, so the
   * two halves of the mesh still meet.
   * @type {Map<string, number>}
   */
  const midpoints = new Map();

  /**
   * @param {number} p First vertex.
   * @param {number} q Second vertex.
   * @return {number} Vertex halfway along the edge in source space.
   */
  function midpoint(p, q) {
    const key = p < q ? `${p},${q}` : `${q},${p}`;
    const found = midpoints.get(key);
    if (found !== undefined) {
      return found;
    }
    const index = source.length / 2;
    const x = (source[p * 2] + source[q * 2]) / 2;
    const y = (source[p * 2 + 1] + source[q * 2 + 1]) / 2;
    source.push(x, y);
    const ok = sample(x, y, point);
    usable.push(ok);
    target.push(point[0], point[1]);
    midpoints.set(key, index);
    return index;
  }

  /** @type {Array<number>} */
  const out = [];
  /** @type {Array<Array<number>>} */
  const pending = [];
  for (let i = 0; i < indices.length; i += 3) {
    pending.push([indices[i], indices[i + 1], indices[i + 2], 0]);
  }

  while (pending.length) {
    const corners = /** @type {Array<number>} */ (pending.pop());
    const depth = corners[3];
    const a = corners[0];
    const b = corners[1];
    const c = corners[2];
    if (!usable[a] || !usable[b] || !usable[c]) {
      continue;
    }
    let split = -1;
    let worstStray = 0;
    let longest = 0;
    let acrossCut = false;
    for (let e = 0; e < 3; ++e) {
      const p = corners[e];
      const q = corners[(e + 1) % 3];
      const length = Math.hypot(
        target[p * 2] - target[q * 2],
        target[p * 2 + 1] - target[q * 2 + 1],
      );
      if (maxEdge > 0 && length > maxEdge) {
        acrossCut = true;
        if (length > longest) {
          longest = length;
          split = e;
        }
      }
      if (acrossCut) {
        continue;
      }
      if (
        !sample(
          (source[p * 2] + source[q * 2]) / 2,
          (source[p * 2 + 1] + source[q * 2 + 1]) / 2,
          point,
        )
      ) {
        continue;
      }
      const stray = Math.hypot(
        point[0] - (target[p * 2] + target[q * 2]) / 2,
        point[1] - (target[p * 2 + 1] + target[q * 2 + 1]) / 2,
      );
      if (stray > worstStray) {
        worstStray = stray;
        split = e;
      }
    }

    if (!acrossCut && worstStray <= maxError) {
      out.push(a, b, c);
      continue;
    }
    if (depth >= MAX_REFINE_DEPTH || split < 0) {
      if (!acrossCut) {
        out.push(a, b, c);
      }
      continue;
    }
    const p = corners[split];
    const q = corners[(split + 1) % 3];
    const opposite = corners[(split + 2) % 3];
    const m = midpoint(p, q);
    pending.push([p, m, opposite, depth + 1], [m, q, opposite, depth + 1]);
  }

  return {flatCoordinates: source, indices: out};
}

/**
 * @typedef {Object} TessellatedPolygon
 * @property {Array<number>} vertices Target-space XY (pairs).
 * @property {Array<number>} indices Triangle indices into `vertices`.
 */

/**
 * Triangulate a polygon. Without `projectToTarget` this is a straight earcut
 * (same as the previous WebGPU fill path). With reprojection, densify, earcut
 * in target space, drop folding triangles, and clip to `clipExtent`.
 *
 * @param {Array<number>} xy Flat XY in source space.
 * @param {Array<number>} holes Earcut hole indices.
 * @param {TessellateOptions} [options] Reprojection options.
 * @return {TessellatedPolygon} Target-space mesh.
 */
export function tessellatePolygon(xy, holes, options) {
  const projectToTarget = options?.projectToTarget;
  const clipExtent = options?.clipExtent;
  const maxSegmentLength = options?.maxSegmentLength || 0;
  const maxSpanX = options?.maxSpanX || 0;
  const maxTargetEdge = options?.maxTargetEdge || 0;

  let sourceXY = xy;
  let sourceHoles = holes;
  // Clipped before triangulation rather than after. Earcut joins parts of a
  // ring that are far apart: a ring circling a pole gets triangles spanning
  // half the world, which then either get dropped, leaving a hole in the fill,
  // or drawn as a wedge across the map. A ring clipped to the extent has no
  // distant parts left to join, and there is less of it left to densify.
  if (clipExtent) {
    const clipped = clipPolygonRings(sourceXY, sourceHoles, clipExtent);
    sourceXY = clipped.flatCoordinates;
    sourceHoles = clipped.holes;
    if (sourceXY.length < 6) {
      return {vertices: [], indices: []};
    }
  }
  if (maxSegmentLength > 0) {
    const dense = densifyPolygonRings(
      sourceXY,
      sourceHoles,
      maxSegmentLength,
      maxSpanX,
    );
    sourceXY = dense.flatCoordinates;
    sourceHoles = dense.holes;
  }

  /** @type {Array<number>} */
  let targetXY = sourceXY;
  if (projectToTarget) {
    targetXY = [];
    for (let i = 0; i < sourceXY.length; i += 2) {
      const projected = projectToTarget([sourceXY[i], sourceXY[i + 1]]);
      if (!projected || !isFinite(projected[0]) || !isFinite(projected[1])) {
        return {vertices: [], indices: []};
      }
      targetXY.push(projected[0], projected[1]);
    }
  }

  const tris = earcut(targetXY, sourceHoles, 2);
  /** @type {Array<number>} */
  const afterSourceCut = [];
  if (maxSpanX > 0) {
    for (let i = 0; i < tris.length; i += 3) {
      const i0 = tris[i];
      const i1 = tris[i + 1];
      const i2 = tris[i + 2];
      const ax = sourceXY[i0 * 2];
      const bx = sourceXY[i1 * 2];
      const cx = sourceXY[i2 * 2];
      if (
        Math.abs(ax - bx) > maxSpanX ||
        Math.abs(bx - cx) > maxSpanX ||
        Math.abs(cx - ax) > maxSpanX
      ) {
        continue;
      }
      afterSourceCut.push(i0, i1, i2);
    }
  }
  const candidates = maxSpanX > 0 ? afterSourceCut : tris;
  let filtered = projectToTarget
    ? filterTrianglesByTargetEdge(
        sourceXY,
        candidates,
        projectToTarget,
        maxTargetEdge,
      )
    : candidates;

  // Earcut worked in source space, where its diagonals are straight; the GPU
  // will draw them straight in the target projection, where they are not.
  const warpGrid = options?.warpGrid;
  const warpExtent = options?.warpExtent;
  if (!projectToTarget && warpGrid?.usable && warpExtent) {
    const refined = refineTriangles(
      sourceXY,
      filtered,
      warpGridSampler(warpGrid, warpExtent),
      options?.maxTargetError || 0,
      warpGrid.maxEdge,
    );
    sourceXY = refined.flatCoordinates;
    targetXY = sourceXY;
    filtered = refined.indices;
  }

  if (!clipExtent) {
    return {vertices: targetXY, indices: Array.from(filtered)};
  }

  /** @type {Array<number>} */
  const vertices = [];
  /** @type {Array<number>} */
  const indices = [];
  for (let i = 0; i < filtered.length; i += 3) {
    const i0 = filtered[i];
    const i1 = filtered[i + 1];
    const i2 = filtered[i + 2];
    const ax = targetXY[i0 * 2];
    const ay = targetXY[i0 * 2 + 1];
    const bx = targetXY[i1 * 2];
    const by = targetXY[i1 * 2 + 1];
    const cx = targetXY[i2 * 2];
    const cy = targetXY[i2 * 2 + 1];
    const clipped = clipFlatTriangleToExtent(
      ax,
      ay,
      bx,
      by,
      cx,
      cy,
      clipExtent,
    );
    for (let t = 0; t < clipped.length; t += 6) {
      const base = vertices.length / 2;
      vertices.push(
        clipped[t],
        clipped[t + 1],
        clipped[t + 2],
        clipped[t + 3],
        clipped[t + 4],
        clipped[t + 5],
      );
      indices.push(base, base + 1, base + 2);
    }
  }
  return {vertices, indices};
}

/**
 * Project a flat XY array. Returns null if any vertex fails.
 *
 * @param {Array<number>} xy Flat XY.
 * @param {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} [projectToTarget] Transform.
 * @param {number} [maxSegmentLength] Densify before projecting.
 * @param {number} [maxSpanX] Densify span limit.
 * @return {Array<number>|null} Target XY, or the input if no transform.
 */
export function projectFlatCoordinates(
  xy,
  projectToTarget,
  maxSegmentLength,
  maxSpanX,
) {
  const source = maxSegmentLength
    ? densifyFlatCoordinates(xy, maxSegmentLength, maxSpanX)
    : xy;
  if (!projectToTarget) {
    return source;
  }
  /** @type {Array<number>} */
  const out = [];
  for (let i = 0; i < source.length; i += 2) {
    const projected = projectToTarget([source[i], source[i + 1]]);
    if (!projected || !isFinite(projected[0]) || !isFinite(projected[1])) {
      return null;
    }
    out.push(projected[0], projected[1]);
  }
  return out;
}
