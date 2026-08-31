/**
 * @module ol/webgpu/reproj
 */
import {
  containsXY,
  createEmpty,
  extendCoordinate,
  getWidth,
} from '../extent.js';
import {equivalent, get as getProjection, getTransform} from '../proj.js';
import {calculateSourceResolution} from '../reproj.js';
import {getKey as getTileCoordKey} from '../tilecoord.js';
import {getUid} from '../util.js';

/**
 * @param {import("../source/Source.js").default} source Source.
 * @param {import("../proj/Projection.js").default} viewProj View projection.
 * @return {boolean} Source data must be warped into the view projection.
 */
export function needsReprojection(source, viewProj) {
  const sourceProj = source.getProjection();
  return !!(sourceProj && viewProj && !equivalent(sourceProj, viewProj));
}

/**
 * Map a view-CRS coordinate into the feature (source) CRS for hit tests.
 * Geometries stay in the source CRS; the pointer is in the view CRS.
 *
 * @param {import("../coordinate.js").Coordinate} coordinate View coordinate.
 * @param {import("../proj/Projection.js").default|null} sourceProj Feature CRS.
 * @param {import("../proj/Projection.js").default} viewProj View projection.
 * @return {import("../coordinate.js").Coordinate|null} Source coordinate, or
 *     the input when the CRS match, or null if the inverse transform fails.
 */
export function viewCoordinateToSource(coordinate, sourceProj, viewProj) {
  if (!sourceProj || !viewProj || equivalent(sourceProj, viewProj)) {
    return coordinate;
  }
  const inverse = getTransform(viewProj, sourceProj);
  if (!inverse) {
    return null;
  }
  const projected = inverse(coordinate);
  if (!projected || !isFinite(projected[0]) || !isFinite(projected[1])) {
    return null;
  }
  return [projected[0], projected[1]];
}

/**
 * Samples per axis a tile is meshed with at its own zoom level.
 * @type {number}
 */
export const DEFAULT_REPROJ_SAMPLES = 16;

/**
 * Refinement cap for tiles standing in for much finer ones. Each level
 * quadruples the projection calls the mesh costs, and a stand-in more than two
 * levels coarse is only ever on screen for the moment it takes tiles to load,
 * so those keep a seam rather than stalling a frame.
 * @type {number}
 */
const MAX_FALLBACK_REFINEMENT = 2;

/**
 * Samples per axis for a tile drawn while it stands in for tiles
 * `levelsCoarser` zoom levels finer than itself.
 *
 * Two tiles that meet along an edge only line up if they sample that edge at
 * the same points. A tile covers twice the ground of the one a level below it,
 * so meshing every tile with the same sample count leaves a stand-in tile
 * sampling half as often as its finer neighbour: its straight edges cut inside
 * the neighbour's, and the projection's curvature shows through as a sliver of
 * background. Matching the source-space step closes it exactly.
 *
 * @param {number} levelsCoarser Zoom levels between this tile and the finest drawn.
 * @return {number} Samples per axis.
 */
export function reprojMeshSamples(levelsCoarser) {
  const levels = Math.max(
    0,
    Math.min(MAX_FALLBACK_REFINEMENT, Math.round(levelsCoarser || 0)),
  );
  return DEFAULT_REPROJ_SAMPLES << levels;
}

/**
 * Cache identity for a GPU reprojection mesh. The target (view) projection
 * must be part of the key so a CRS change does not reuse vertices built for
 * a previous view projection, and the sample count because a tile standing in
 * for finer ones is meshed more densely.
 *
 * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coord.
 * @param {import("../proj/Projection.js").default} sourceProj Source projection.
 * @param {import("../proj/Projection.js").default} targetProj Target projection.
 * @param {number} [samples] Samples per axis.
 * @return {string} Key.
 */
export function reprojMeshCacheKey(tileCoord, sourceProj, targetProj, samples) {
  return (
    getTileCoordKey(tileCoord) +
    '/' +
    getUid(sourceProj) +
    '/' +
    getUid(targetProj) +
    '/' +
    (samples === undefined ? DEFAULT_REPROJ_SAMPLES : samples)
  );
}

/**
 * Widen a source extent when the view shows a pole.
 *
 * Sampling a view extent can never find a pole reliably: in a polar projection
 * the pole is a single interior point where every meridian meets, so a sampled
 * bounding box stops short of it in latitude, and no sample need land near the
 * antimeridian at all. The longitudes between the outermost samples and the
 * antimeridian are then left out of the extent, and the tiles covering them are
 * never asked for, which shows as a wedge of missing map running from the pole
 * to the edge of the view.
 *
 * A pole on screen means every meridian is on screen, so the source spans its
 * whole width. Latitude is left to the samples: a source reaching the far pole
 * does not put the far pole in view.
 *
 * @param {import("../extent.js").Extent} extent Sampled source extent, modified in place.
 * @param {import("../extent.js").Extent} viewExtent View extent.
 * @param {import("../proj/Projection.js").default} sourceProj Source projection.
 * @param {import("../proj/Projection.js").default} viewProj View projection.
 */
function extendForVisiblePoles(extent, viewExtent, sourceProj, viewProj) {
  const world = sourceProj.getExtent();
  if (!world || !sourceProj.isGlobal()) {
    return;
  }
  const geographic = getProjection('EPSG:4326');
  const toSource = geographic && getTransform(geographic, sourceProj);
  if (!toSource) {
    return;
  }
  for (const latitude of [90, -90]) {
    if (!poleInView(latitude, viewExtent, viewProj)) {
      continue;
    }
    // Mercator and its like place the pole at infinity; stop at the world edge.
    const poleY = toSource([0, latitude], undefined, undefined, 2)[1];
    const y = isFinite(poleY) ? poleY : latitude > 0 ? world[3] : world[1];
    // Set the width rather than widen it. Samples are measured from the view
    // centre, whose longitude at a pole is arbitrary, so widening could span
    // more than a world and ask for the same tiles twice over.
    extent[0] = world[0];
    extent[2] = world[2];
    extent[1] = Math.min(extent[1], y);
    extent[3] = Math.max(extent[3], y);
  }
}

/**
 * Whether a pole falls inside a view extent.
 *
 * @param {number} latitude Pole latitude, 90 or -90.
 * @param {import("../extent.js").Extent} viewExtent View extent.
 * @param {import("../proj/Projection.js").default} viewProj View projection.
 * @return {boolean} The pole is on screen.
 */
export function poleInView(latitude, viewExtent, viewProj) {
  const geographic = getProjection('EPSG:4326');
  const toView = geographic && getTransform(geographic, viewProj);
  if (!toView) {
    return false;
  }
  const projected = toView([0, latitude], undefined, undefined, 2);
  return (
    !!projected &&
    isFinite(projected[0]) &&
    isFinite(projected[1]) &&
    containsXY(viewExtent, projected[0], projected[1])
  );
}

/**
 * Approximate the source-projection extent covering a view extent.
 *
 * The result is meant to be a superset: callers clip geometry to it, so
 * anything it misses is not drawn. Samples can fall outside the source
 * projection's own world, so callers that need a valid extent finish with
 * {@link clipExtentToProjection}.
 *
 * @param {import("../extent.js").Extent} viewExtent View extent.
 * @param {import("../proj/Projection.js").default} sourceProj Source projection.
 * @param {import("../proj/Projection.js").default} viewProj View projection.
 * @param {number} [samples] Samples along each axis.
 * @param {import("../extent.js").Extent} [poleExtent] Extent to judge pole
 *     visibility by, when geometry is built for more than the view shows.
 * @return {import("../extent.js").Extent|null} Source extent.
 */
export function estimateSourceExtent(
  viewExtent,
  sourceProj,
  viewProj,
  samples = 8,
  poleExtent,
) {
  const inverse = getTransform(viewProj, sourceProj);
  if (!inverse) {
    return null;
  }
  const extent = createEmpty();
  const n = Math.max(2, samples);
  let count = 0;

  const centerX = (viewExtent[0] + viewExtent[2]) / 2;
  const centerY = (viewExtent[1] + viewExtent[3]) / 2;
  const world = sourceProj.canWrapX() ? sourceProj.getExtent() : null;
  const worldWidth = world ? getWidth(world) : 0;
  const centerSource = inverse([centerX, centerY], undefined, undefined, 2);
  // Which world the extent is written in. A view straddling the antimeridian
  // has samples at both ends of the source's x range, and their bounding box
  // is the whole world: every longitude's tiles get asked for, and every
  // longitude's geometry gets kept and drawn as a wedge across the map.
  // Measuring each sample from the centre keeps the range contiguous, running
  // past the edge of the world rather than wrapping around it.
  const reference =
    worldWidth > 0 && isFinite(centerSource[0]) ? centerSource[0] : null;

  /**
   * @param {number} x View x.
   * @param {number} y View y.
   */
  const sample = (x, y) => {
    const sourceCoord = inverse([x, y], undefined, undefined, 2);
    if (isFinite(sourceCoord[0]) && isFinite(sourceCoord[1])) {
      if (reference !== null) {
        sourceCoord[0] -=
          worldWidth * Math.round((sourceCoord[0] - reference) / worldWidth);
      }
      extendCoordinate(extent, sourceCoord);
      count += 1;
    }
  };

  for (let j = 0; j < n; ++j) {
    const y = viewExtent[1] + (j / (n - 1)) * (viewExtent[3] - viewExtent[1]);
    for (let i = 0; i < n; ++i) {
      sample(
        viewExtent[0] + (i / (n - 1)) * (viewExtent[2] - viewExtent[0]),
        y,
      );
    }
  }
  // An even grid straddles the centre, which is exactly where a polar view
  // hides its most extreme source coordinates.
  sample(centerX, centerY);
  if (!count) {
    return null;
  }

  extendForVisiblePoles(extent, poleExtent || viewExtent, sourceProj, viewProj);
  return extent;
}

/**
 * Clip a source-space extent to the projection's valid area. Inverse samples
 * of EPSG:4326 poles are finite but lie far outside Web Mercator; using them
 * as a tile query invents coords whose meshes collapse to ±90° and never
 * appear. X is left unclipped when `wrapX` is set so dateline queries can
 * still wrap.
 *
 * @param {import("../extent.js").Extent} extent Source extent.
 * @param {import("../proj/Projection.js").default} projection Source projection.
 * @param {boolean} [wrapX] Source wraps in X.
 * @return {import("../extent.js").Extent|null} Clipped extent, or null if empty.
 */
export function clipExtentToProjection(extent, projection, wrapX) {
  const world = projection.getExtent();
  if (!world) {
    return extent.slice();
  }
  const clipped = extent.slice();
  clipped[1] = Math.max(clipped[1], world[1]);
  clipped[3] = Math.min(clipped[3], world[3]);
  if (!wrapX) {
    clipped[0] = Math.max(clipped[0], world[0]);
    clipped[2] = Math.min(clipped[2], world[2]);
  }
  if (clipped[1] > clipped[3] || (!wrapX && clipped[0] > clipped[2])) {
    return null;
  }
  return clipped;
}

/**
 * Samples per axis taken across a view extent to find the source resolution
 * it needs. An odd count keeps a sample on the centre.
 * @type {number}
 */
const RESOLUTION_SAMPLES = 5;

/**
 * The source resolution a view needs: the finest any part of it asks for.
 *
 * How much source detail a view wants varies across the view, by a factor of
 * ten or more where the two projections stretch differently. Reading it at the
 * centre alone is unstable, because the centre can sit on a place the source
 * cannot describe: at the pole of a polar view a mercator source is stretched
 * without limit, and a few pixels of panning swings the answer by three zoom
 * levels, in and out of the coarsest tiles the grid has. Tiles are then drawn
 * at a zoom that keeps changing, and neighbours several levels apart cannot be
 * made to meet.
 *
 * Sampling the whole extent and keeping the finest gives an answer that moves
 * as smoothly as the view does, and leaves no part of the view drawn from data
 * coarser than it needs. Samples the source cannot place are skipped, so the
 * unmapped area around a pole does not drag the answer coarse.
 *
 * A view can also show more than its projection covers, as a world projection
 * does at zoom 0. Coordinates out there fold onto the projection's limb: they
 * come back finite and in range, but from a point the view never asked about,
 * and the scale there has collapsed to nothing. Only samples that project back
 * to where they started are believed.
 *
 * @param {import("../proj/Projection.js").default} sourceProj Source projection.
 * @param {import("../proj/Projection.js").default} viewProj View projection.
 * @param {import("../coordinate.js").Coordinate} viewCenter View center.
 * @param {number} viewResolution View resolution.
 * @param {import("../extent.js").Extent} [viewExtent] View extent to sample.
 * @return {number} Source resolution.
 */
export function sourceResolutionForView(
  sourceProj,
  viewProj,
  viewCenter,
  viewResolution,
  viewExtent,
) {
  const atCenter = calculateSourceResolution(
    sourceProj,
    viewProj,
    viewCenter,
    viewResolution,
  );
  const inverse = viewExtent && getTransform(viewProj, sourceProj);
  const forward = viewExtent && getTransform(sourceProj, viewProj);
  if (!inverse || !forward) {
    return atCenter;
  }
  const world = sourceProj.getExtent();
  const n = RESOLUTION_SAMPLES;
  let finest = Infinity;
  for (let j = 0; j < n; ++j) {
    const y = viewExtent[1] + (j / (n - 1)) * (viewExtent[3] - viewExtent[1]);
    for (let i = 0; i < n; ++i) {
      const x = viewExtent[0] + (i / (n - 1)) * (viewExtent[2] - viewExtent[0]);
      const source = inverse([x, y], undefined, undefined, 2);
      if (
        !isFinite(source[0]) ||
        !isFinite(source[1]) ||
        (world && !containsXY(world, source[0], source[1]))
      ) {
        continue;
      }
      const back = forward(source.slice(), undefined, undefined, 2);
      if (
        !isFinite(back[0]) ||
        !isFinite(back[1]) ||
        Math.hypot(back[0] - x, back[1] - y) > viewResolution
      ) {
        continue;
      }
      const resolution = calculateSourceResolution(
        sourceProj,
        viewProj,
        [x, y],
        viewResolution,
      );
      if (isFinite(resolution) && resolution > 0 && resolution < finest) {
        finest = resolution;
      }
    }
  }
  return isFinite(finest) ? finest : atCenter;
}

/**
 * Maximum triangle size relative to the target world width. Source-grid edges
 * that jump a projection cut (antimeridian, Mollweide limb) become screen-
 * spanning triangles; clamp-to-edge then paints a tile-edge color as a streak.
 * Same threshold as `ol/reproj/Triangulation`.
 * @type {number}
 */
const MAX_TRIANGLE_WIDTH = 0.25;

/**
 * Relative inset from a wrap-X world edge before forward projection.
 * Mercator max-x converts to lon 180+ε, which Mollweide (and similar) maps
 * into the opposite hemisphere — pulling dateline tile edges across the map.
 * @type {number}
 */
const WRAP_EDGE_INSET = 1e-9;

/**
 * Nudge wrap-X coordinates off the world edge so float error does not flip
 * the hemisphere when forwarding into the view projection.
 *
 * @param {number} x Source X.
 * @param {number} y Source Y.
 * @param {import("../proj/Projection.js").default} sourceProj Source projection.
 * @return {Array<number>} Coordinate safe to project.
 */
function insetWrapXEdges(x, y, sourceProj) {
  if (!sourceProj.canWrapX()) {
    return [x, y];
  }
  const world = sourceProj.getExtent();
  if (!world) {
    return [x, y];
  }
  const worldWidth = getWidth(world);
  if (!(worldWidth > 0)) {
    return [x, y];
  }
  const inset = worldWidth * WRAP_EDGE_INSET;
  if (x > world[2] - inset && x < world[2] + inset) {
    return [world[2] - inset, y];
  }
  if (x < world[0] + inset && x > world[0] - inset) {
    return [world[0] + inset, y];
  }
  return [x, y];
}

/**
 * How far a quad may be refined when its corners straddle a projection edge or
 * its target edges are too long. Each level quarters the cell, so three levels
 * turn the base grid into an effective 128 samples per axis where it matters.
 * @type {number}
 */
const MAX_MESH_DEPTH = 3;

/**
 * Coordinates further out than this many target worlds are treated as a
 * projection failure. Polar stereographic sends the opposite pole to about
 * 1e23, which is not geometry worth keeping.
 * @type {number}
 */
const MAX_TARGET_WORLDS = 64;

/**
 * Build a source-to-target mesh for a tile. Positions are in the view projection.
 *
 * A projection can both stretch a tile enormously and cut it in two, and the
 * mesh has to tell those apart: stretching is refined until the triangles are
 * small enough, while a cut is dropped so a jump cannot smear a triangle
 * across the map. The test is the same one the vector path uses: project the
 * midpoint of a long edge and see whether it lands near the chord.
 *
 * @param {import("../extent.js").Extent} sourceExtent Tile extent in source projection.
 * @param {import("../proj/Projection.js").default} sourceProj Source projection.
 * @param {import("../proj/Projection.js").default} targetProj Target projection.
 * @param {number} [samples] Samples per axis.
 * @return {{vertices: Float32Array, indices: Uint32Array}|null} Mesh or null if projection failed.
 */
export function buildReprojMesh(
  sourceExtent,
  sourceProj,
  targetProj,
  samples = DEFAULT_REPROJ_SAMPLES,
) {
  const transform = getTransform(sourceProj, targetProj);
  if (!transform) {
    return null;
  }
  const forward = transform;
  const targetWorld = targetProj.getExtent();
  const worldWidth = targetWorld ? getWidth(targetWorld) : 0;
  const maxEdgeSq =
    worldWidth > 0 ? (worldWidth * MAX_TRIANGLE_WIDTH) ** 2 : Infinity;
  const maxMagnitude =
    worldWidth > 0 ? worldWidth * MAX_TARGET_WORLDS : Number.MAX_VALUE;

  const width = sourceExtent[2] - sourceExtent[0];
  const height = sourceExtent[3] - sourceExtent[1];

  /** @type {Array<number>} */
  const vertexData = [];
  /** @type {Map<string, number>} */
  const indexByUv = new Map();
  /** @type {Array<boolean>} */
  const valid = [];
  let validCount = 0;

  /**
   * Project a point of the tile, reusing corners shared with neighbouring
   * quads so refined cells stay welded together.
   *
   * @param {number} u Fraction across the tile.
   * @param {number} v Fraction down the tile.
   * @return {number} Vertex index.
   */
  function vertexAt(u, v) {
    const key = u + ',' + v;
    const cached = indexByUv.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const [sx, sy] = insetWrapXEdges(
      sourceExtent[0] + width * u,
      sourceExtent[3] - height * v,
      sourceProj,
    );
    const t = forward([sx, sy], undefined, undefined, 2);
    const ok =
      isFinite(t[0]) &&
      isFinite(t[1]) &&
      Math.abs(t[0]) <= maxMagnitude &&
      Math.abs(t[1]) <= maxMagnitude;
    const index = valid.length;
    vertexData.push(ok ? t[0] : 0, ok ? t[1] : 0, u, v);
    valid.push(ok);
    if (ok) {
      validCount += 1;
    }
    indexByUv.set(key, index);
    return index;
  }

  /**
   * @param {number} i Vertex index.
   * @param {number} k Vertex index.
   * @return {number} Squared target distance.
   */
  function edgeSq(i, k) {
    const dx = vertexData[i * 4] - vertexData[k * 4];
    const dy = vertexData[i * 4 + 1] - vertexData[k * 4 + 1];
    return dx * dx + dy * dy;
  }

  /**
   * A long edge is either honest stretching, which refines away, or a jump
   * across a projection cut, which does not.
   *
   * @param {number} i Vertex index.
   * @param {number} k Vertex index.
   * @return {boolean} The edge jumps a cut.
   */
  function jumpsCut(i, k) {
    const midIndex = vertexAt(
      (vertexData[i * 4 + 2] + vertexData[k * 4 + 2]) / 2,
      (vertexData[i * 4 + 3] + vertexData[k * 4 + 3]) / 2,
    );
    if (!valid[midIndex]) {
      return true;
    }
    const chordX = (vertexData[i * 4] + vertexData[k * 4]) / 2;
    const chordY = (vertexData[i * 4 + 1] + vertexData[k * 4 + 1]) / 2;
    const dx = vertexData[midIndex * 4] - chordX;
    const dy = vertexData[midIndex * 4 + 1] - chordY;
    return dx * dx + dy * dy > edgeSq(i, k) * 0.25;
  }

  /** @type {Array<number>} */
  const indexList = [];

  /**
   * @param {number} a First corner.
   * @param {number} b Second corner.
   * @param {number} c Third corner.
   * @return {boolean} All edges are short enough to draw.
   */
  function triangleFits(a, b, c) {
    return (
      edgeSq(a, b) <= maxEdgeSq &&
      edgeSq(b, c) <= maxEdgeSq &&
      edgeSq(c, a) <= maxEdgeSq
    );
  }

  /**
   * @param {number} u0 Left.
   * @param {number} v0 Top.
   * @param {number} u1 Right.
   * @param {number} v1 Bottom.
   * @param {number} depth Remaining refinement levels.
   */
  function emitQuad(u0, v0, u1, v1, depth) {
    const a = vertexAt(u0, v0);
    const b = vertexAt(u1, v0);
    const c = vertexAt(u0, v1);
    const d = vertexAt(u1, v1);
    const validHere =
      (valid[a] ? 1 : 0) +
      (valid[b] ? 1 : 0) +
      (valid[c] ? 1 : 0) +
      (valid[d] ? 1 : 0);
    if (validHere === 0) {
      return;
    }

    if (validHere === 4) {
      const longest = Math.max(
        edgeSq(a, b),
        edgeSq(a, c),
        edgeSq(b, d),
        edgeSq(c, d),
        edgeSq(a, d),
        edgeSq(b, c),
      );
      if (longest <= maxEdgeSq) {
        indexList.push(a, c, b, b, c, d);
        return;
      }
      // A cut cannot be refined away, so stop as soon as one is found.
      if (
        (edgeSq(a, b) > maxEdgeSq && jumpsCut(a, b)) ||
        (edgeSq(a, c) > maxEdgeSq && jumpsCut(a, c)) ||
        (edgeSq(b, d) > maxEdgeSq && jumpsCut(b, d)) ||
        (edgeSq(c, d) > maxEdgeSq && jumpsCut(c, d))
      ) {
        return;
      }
    }

    if (depth > 0) {
      const um = (u0 + u1) / 2;
      const vm = (v0 + v1) / 2;
      emitQuad(u0, v0, um, vm, depth - 1);
      emitQuad(um, v0, u1, vm, depth - 1);
      emitQuad(u0, vm, um, v1, depth - 1);
      emitQuad(um, vm, u1, v1, depth - 1);
      return;
    }

    // Out of refinement: keep whichever half of the quad is still usable.
    if (valid[a] && valid[c] && valid[b] && triangleFits(a, c, b)) {
      indexList.push(a, c, b);
    }
    if (valid[b] && valid[c] && valid[d] && triangleFits(b, c, d)) {
      indexList.push(b, c, d);
    }
    if (validHere === 3) {
      if (
        !valid[b] &&
        valid[a] &&
        valid[c] &&
        valid[d] &&
        triangleFits(a, c, d)
      ) {
        indexList.push(a, c, d);
      } else if (
        !valid[c] &&
        valid[a] &&
        valid[d] &&
        valid[b] &&
        triangleFits(a, d, b)
      ) {
        indexList.push(a, d, b);
      }
    }
  }

  for (let j = 0; j < samples; ++j) {
    for (let i = 0; i < samples; ++i) {
      emitQuad(
        i / samples,
        j / samples,
        (i + 1) / samples,
        (j + 1) / samples,
        MAX_MESH_DEPTH,
      );
    }
  }

  if (validCount < 4 || !indexList.length) {
    return null;
  }
  return {
    vertices: Float32Array.from(vertexData),
    indices: Uint32Array.from(indexList),
  };
}

/**
 * Fold a batch's local grid into a coordinate-to-pixel transform, so vertices
 * stored in grid units can be drawn with a single matrix.
 *
 * With `world = origin + local * scale` and `pixel = A * world + t`, this is
 * `pixel = (A * scale) * local + (A * origin + t)`, where each axis carries
 * its own scale.
 *
 * @param {import("../transform.js").Transform} coordinateToPixel Coordinate to pixel.
 * @param {number} originX Grid origin x in map units.
 * @param {number} originY Grid origin y in map units.
 * @param {number} scaleX Map units per grid step in x.
 * @param {number} scaleY Map units per grid step in y.
 * @param {import("../transform.js").Transform} out Receives the result.
 * @return {import("../transform.js").Transform} out
 */
export function localCoordinateToPixel(
  coordinateToPixel,
  originX,
  originY,
  scaleX,
  scaleY,
  out,
) {
  const a = coordinateToPixel[0];
  const b = coordinateToPixel[1];
  const c = coordinateToPixel[2];
  const d = coordinateToPixel[3];
  out[0] = a * scaleX;
  out[1] = b * scaleX;
  out[2] = c * scaleY;
  out[3] = d * scaleY;
  out[4] = coordinateToPixel[4] + a * originX + c * originY;
  out[5] = coordinateToPixel[5] + b * originX + d * originY;
  return out;
}

/**
 * World-to-clip matrix for view coordinates (center origin, Y up in clip).
 *
 * `worldOffset` shifts geometry in X before the view transform, the same way
 * canvas vector tiles use `getRenderTransform(..., offsetX)` so a wrapped
 * tile (canonical coords) draws in the adjacent world.
 *
 * @param {import("../Map.js").FrameState} frameState Frame state.
 * @param {import("../transform.js").Transform} coordinateToPixel Coordinate to pixel.
 * @param {Float32Array} out 16-float matrix.
 * @param {number} [worldOffset] X offset in view coordinates.
 * @return {Float32Array} out
 */
export function projectionMatrixFromFrame(
  frameState,
  coordinateToPixel,
  out,
  worldOffset,
) {
  const size = frameState.size;
  const a = coordinateToPixel[0];
  const b = coordinateToPixel[1];
  const c = coordinateToPixel[2];
  const d = coordinateToPixel[3];
  const offset = worldOffset || 0;
  const e = coordinateToPixel[4] + a * offset;
  const f = coordinateToPixel[5] + b * offset;
  const sx = 2 / size[0];
  const sy = -2 / size[1];
  out[0] = a * sx;
  out[1] = b * sy;
  out[2] = 0;
  out[3] = 0;
  out[4] = c * sx;
  out[5] = d * sy;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = e * sx - 1;
  out[13] = f * sy + 1;
  out[14] = 0;
  out[15] = 1;
  return out;
}
