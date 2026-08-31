/**
 * @module ol/render/webgpu/geometryBuffers
 *
 * Turns tessellation jobs into the typed arrays the WebGPU vector pipelines
 * consume. Nothing here touches features, styles, or the DOM, so the same code
 * runs on the main thread and inside {@link module:ol/worker/webgpuvector}.
 */
import {clipFlatLineStrings} from '../../geom/flat/clip.js';
import {compareDraw} from './drawOrder.js';
import {LOCAL_EXTENT} from './localGrid.js';
import {projectFlatCoordinates, tessellatePolygon} from './tessellate.js';
import {warpGridSampler} from './warpGrid.js';

const INT16_MIN = -32768;
const INT16_MAX = 32767;

/**
 * @typedef {Object} LocalGrid
 * @property {number} originX Grid origin x in map units.
 * @property {number} originY Grid origin y in map units.
 * @property {number} scaleX Map units per grid step in x.
 * @property {number} scaleY Map units per grid step in y.
 */

/**
 * Each axis gets its own step, so a batch that is wide and short keeps full
 * precision on both. A polar view is the extreme case: it sees every meridian
 * but only a narrow band of latitude, and a square grid would quantize that
 * latitude to kilometres.
 *
 * Stroke normals are unaffected, because they are stored as separate float32
 * attributes in map units and are never quantized.
 *
 * @param {import("../../extent.js").Extent} extent Extent the batch covers.
 * @return {LocalGrid} Grid.
 */
export function createLocalGrid(extent) {
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  return {
    originX: extent[0],
    originY: extent[1],
    scaleX: width > 0 ? width / LOCAL_EXTENT : 1,
    scaleY: height > 0 ? height / LOCAL_EXTENT : 1,
  };
}

/**
 * @param {number} value Map coordinate.
 * @param {number} origin Grid origin.
 * @param {number} scale Map units per step.
 * @return {number} Grid coordinate, clamped to the int16 range.
 */
function toLocal(value, origin, scale) {
  const local = Math.round((value - origin) / scale);
  return local < INT16_MIN ? INT16_MIN : local > INT16_MAX ? INT16_MAX : local;
}

/**
 * @param {import("../../extent.js").Extent} extent Extent.
 * @return {number} Epsilon for clip-edge tests.
 */
function clipEdgeEpsilon(extent) {
  return Math.max(extent[2] - extent[0], extent[3] - extent[1]) * 1e-6;
}

/**
 * True when both endpoints lie on the same side of `extent` (an MVT clip edge).
 *
 * @param {number} x1 Start x.
 * @param {number} y1 Start y.
 * @param {number} x2 End x.
 * @param {number} y2 End y.
 * @param {import("../../extent.js").Extent} extent Clip extent.
 * @param {number} eps Distance tolerance.
 * @return {boolean} Segment is a clip edge.
 */
function segmentOnClipEdge(x1, y1, x2, y2, extent, eps) {
  return (
    (Math.abs(x1 - extent[0]) <= eps && Math.abs(x2 - extent[0]) <= eps) ||
    (Math.abs(x1 - extent[2]) <= eps && Math.abs(x2 - extent[2]) <= eps) ||
    (Math.abs(y1 - extent[1]) <= eps && Math.abs(y2 - extent[1]) <= eps) ||
    (Math.abs(y1 - extent[3]) <= eps && Math.abs(y2 - extent[3]) <= eps)
  );
}

/**
 * One polygon or line to turn into triangles.
 *
 * @typedef {Object} GeometryJob
 * @property {'fill'|'stroke'} kind What to emit.
 * @property {number} start First vertex in the shared coordinate array.
 * @property {number} count Vertex count.
 * @property {Array<number>} [holes] Ring starts relative to `start`, for fills.
 * @property {number} styleIndex Index into the style table.
 * @property {number} [width] Stroke width in pixels.
 * @property {boolean} [skipClipEdges] Drop segments lying on the clip extent.
 * @property {number} [zIndex] Style z-index.
 * @property {number} [classRank] Canvas class order.
 * @property {number} [sequence] Render sequence.
 * @property {number} [featureRef] Feature ref.
 */

/**
 * @typedef {Object} GeometryRequest
 * @property {Array<GeometryJob>} jobs Jobs.
 * @property {Float64Array} coordinates Shared x/y pairs in map units.
 * @property {Float32Array} styles Styles, `STYLE_STRIDE` floats each (see `buffers.js`).
 * @property {import("../../extent.js").Extent} gridExtent Extent the local grid covers.
 * @property {import("../../extent.js").Extent} [clipExtent] Clip extent.
 * @property {number} [maxSegmentLength] Densify source segments.
 * @property {number} [maxSpanX] Maximum source segment span in x.
 * @property {number} [maxTargetEdge] Maximum target edge before cut filtering.
 * @property {number} [worldWidth] Source world width, for wrapping into the grid.
 * @property {import("./warpGrid.js").WarpGrid} [warpGrid] Sampled projection the GPU will warp with.
 * @property {import("../../extent.js").Extent} [warpExtent] Source extent `warpGrid` covers.
 * @property {number} [maxTargetError] Target distance a straight triangle edge may stray by.
 * @property {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} [projectToTarget]
 *     Source to target transform. Main thread only; not transferable.
 */

/**
 * @typedef {Object} GeometryBuffers
 * @property {Int16Array} fillPositions Fill positions in grid units.
 * @property {Uint32Array} fillStyles Style index per fill vertex.
 * @property {Uint32Array} fillIndices Fill indices.
 * @property {Int16Array} strokePositions Stroke positions in grid units.
 * @property {Float32Array} strokeAttributes Normal x, normal y, width, and
 *     distance along the line in drawn map units, per stroke vertex.
 * @property {Uint32Array} strokeStyles Style index per stroke vertex.
 * @property {Uint32Array} strokeIndices Stroke indices.
 * @property {Float32Array} styles Styles, `STYLE_STRIDE` floats each (see `buffers.js`).
 * @property {LocalGrid} grid Grid the positions are expressed in.
 * @property {Array<import("./drawOrder.js").DrawCommand>} ranges Index ranges in draw order.
 */

/**
 * @param {GeometryRequest} request Request.
 * @return {GeometryBuffers} Buffers.
 */
export function buildGeometryBuffers(request) {
  const grid = createLocalGrid(request.gridExtent);
  const coordinates = request.coordinates;
  const reproj = {
    projectToTarget: request.projectToTarget,
    clipExtent: request.clipExtent,
    maxSegmentLength: request.maxSegmentLength,
    maxSpanX: request.maxSpanX,
    maxTargetEdge: request.maxTargetEdge,
    warpGrid: request.warpGrid,
    warpExtent: request.warpExtent,
    maxTargetError: request.maxTargetError,
  };

  /** @type {Array<number>} */
  const fillPositions = [];
  /** @type {Array<number>} */
  const fillStyles = [];
  /** @type {Array<number>} */
  const fillIndices = [];
  /** @type {Array<number>} */
  const strokePositions = [];
  /** @type {Array<number>} */
  const strokeAttributes = [];
  /** @type {Array<number>} */
  const strokeStyles = [];
  /** @type {Array<number>} */
  const strokeIndices = [];

  const worldWidth = request.worldWidth || 0;
  const gridCenterX = (request.gridExtent[0] + request.gridExtent[2]) / 2;
  /** @type {Array<import("./drawOrder.js").DrawCommand>} */
  const ranges = [];
  const jobs = request.jobs.slice().sort((a, b) =>
    compareDraw(
      {
        zIndex: a.zIndex || 0,
        classRank: a.classRank || 0,
        sequence: a.sequence || 0,
        pipeline: a.kind,
        start: 0,
        count: 0,
        featureRef: a.featureRef || 0,
      },
      {
        zIndex: b.zIndex || 0,
        classRank: b.classRank || 0,
        sequence: b.sequence || 0,
        pipeline: b.kind,
        start: 0,
        count: 0,
        featureRef: b.featureRef || 0,
      },
    ),
  );

  for (const job of jobs) {
    /** @type {Array<number>} */
    const xy = [];
    for (let i = 0; i < job.count; ++i) {
      const offset = (job.start + i) * 2;
      xy.push(coordinates[offset], coordinates[offset + 1]);
    }
    // A view straddling the antimeridian gets a grid that runs past the edge
    // of the world, so geometry on the far side arrives a whole world away
    // from it and would be clipped off. Shift it in, per geometry rather than
    // per point, so shapes that cross the edge themselves stay in one piece.
    if (worldWidth > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < xy.length; i += 2) {
        minX = Math.min(minX, xy[i]);
        maxX = Math.max(maxX, xy[i]);
      }
      const shift =
        worldWidth * Math.round((gridCenterX - (minX + maxX) / 2) / worldWidth);
      if (shift !== 0) {
        for (let i = 0; i < xy.length; i += 2) {
          xy[i] += shift;
        }
      }
    }
    if (job.kind === 'fill') {
      const indexStart = fillIndices.length;
      emitFill(xy, job, grid, reproj, fillPositions, fillStyles, fillIndices);
      pushRange(ranges, job, indexStart, fillIndices.length - indexStart);
    } else {
      const indexStart = strokeIndices.length;
      emitStroke(
        xy,
        job,
        grid,
        reproj,
        strokePositions,
        strokeAttributes,
        strokeStyles,
        strokeIndices,
      );
      pushRange(ranges, job, indexStart, strokeIndices.length - indexStart);
    }
  }

  return {
    fillPositions: new Int16Array(fillPositions),
    fillStyles: new Uint32Array(fillStyles),
    fillIndices: new Uint32Array(fillIndices),
    strokePositions: new Int16Array(strokePositions),
    strokeAttributes: new Float32Array(strokeAttributes),
    strokeStyles: new Uint32Array(strokeStyles),
    strokeIndices: new Uint32Array(strokeIndices),
    styles: request.styles,
    grid,
    ranges,
  };
}

/**
 * @param {Array<import("./drawOrder.js").DrawCommand>} ranges Ranges.
 * @param {GeometryJob} job Job.
 * @param {number} start First index.
 * @param {number} count Index count.
 */
function pushRange(ranges, job, start, count) {
  if (!count) {
    return;
  }
  ranges.push({
    zIndex: job.zIndex || 0,
    classRank: job.classRank || 0,
    sequence: job.sequence || 0,
    pipeline: job.kind,
    start,
    count,
    featureRef: job.featureRef || 0,
  });
}

/**
 * @param {Array<number>} xy Flat x/y pairs.
 * @param {GeometryJob} job Job.
 * @param {LocalGrid} grid Grid.
 * @param {import("./tessellate.js").TessellateOptions} reproj Tessellation options.
 * @param {Array<number>} positions Positions out.
 * @param {Array<number>} styleIndices Style indices out.
 * @param {Array<number>} indices Indices out.
 */
function emitFill(xy, job, grid, reproj, positions, styleIndices, indices) {
  if (xy.length < 6) {
    return;
  }
  const mesh = tessellatePolygon(xy, job.holes || [], reproj);
  const base = positions.length / 2;
  for (let i = 0; i < mesh.vertices.length; i += 2) {
    positions.push(
      toLocal(mesh.vertices[i], grid.originX, grid.scaleX),
      toLocal(mesh.vertices[i + 1], grid.originY, grid.scaleY),
    );
    styleIndices.push(job.styleIndex);
  }
  // Positions are rounded onto the grid, and a triangle thinner than one of
  // its steps either collapses or turns inside out. Drawing an inside-out one
  // paints a sliver that is not part of the polygon, which a translucent fill
  // shows as a darker streak, so those are left out. What they covered was
  // narrower than the grid can hold in the first place.
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const a = mesh.indices[i];
    const b = mesh.indices[i + 1];
    const c = mesh.indices[i + 2];
    const before = crossOf(mesh.vertices, a, b, c);
    const after = crossOf(positions, base + a, base + b, base + c);
    if (after === 0 || (before !== 0 && after > 0 !== before > 0)) {
      continue;
    }
    indices.push(a + base, b + base, c + base);
  }
}

/**
 * Twice the signed area of a triangle, from a flat array of x/y pairs.
 *
 * @param {Array<number>} xy Flat x/y pairs.
 * @param {number} a First vertex.
 * @param {number} b Second vertex.
 * @param {number} c Third vertex.
 * @return {number} Cross product of the two edges leaving `a`.
 */
function crossOf(xy, a, b, c) {
  return (
    (xy[b * 2] - xy[a * 2]) * (xy[c * 2 + 1] - xy[a * 2 + 1]) -
    (xy[c * 2] - xy[a * 2]) * (xy[b * 2 + 1] - xy[a * 2 + 1])
  );
}

/**
 * Emits a quad per segment, each vertex carrying its distance along the line
 * for the dash pattern. Distances are measured where the line is drawn: after
 * the GPU warp when there is one, so dashes keep their length on screen. They
 * start again at zero for each part a clip cuts the line into, and keep
 * counting across segments that are left out.
 *
 * @param {Array<number>} xy Flat x/y pairs.
 * @param {GeometryJob} job Job.
 * @param {LocalGrid} grid Grid.
 * @param {import("./tessellate.js").TessellateOptions} reproj Tessellation options.
 * @param {Array<number>} positions Positions out.
 * @param {Array<number>} attributes Normal x, normal y, width, and distance out.
 * @param {Array<number>} styleIndices Style indices out.
 * @param {Array<number>} indices Indices out.
 */
function emitStroke(
  xy,
  job,
  grid,
  reproj,
  positions,
  attributes,
  styleIndices,
  indices,
) {
  const projected = projectCoordinates(xy, reproj);
  if (!projected || projected.length < 4) {
    return;
  }
  const clipExtent = reproj.clipExtent;
  let parts = projected;
  let ends = [projected.length];
  if (clipExtent) {
    const clipped = clipFlatLineStrings(
      projected,
      [projected.length],
      2,
      clipExtent,
    );
    parts = clipped.flatCoordinates;
    ends = clipped.ends;
    if (!parts.length) {
      return;
    }
  }
  const width = job.width || 1;
  const eps = clipExtent ? clipEdgeEpsilon(clipExtent) : 0;
  const maxEdge = reproj.maxTargetEdge || 0;
  const drawnLength = drawnSegmentLength(reproj);
  let offset = 0;
  for (const end of ends) {
    let distance = 0;
    for (let i = offset; i < end - 2; i += 2) {
      const x1 = parts[i];
      const y1 = parts[i + 1];
      const x2 = parts[i + 2];
      const y2 = parts[i + 3];
      const d1 = distance;
      distance += drawnLength(x1, y1, x2, y2);
      const d2 = distance;
      if (
        job.skipClipEdges &&
        clipExtent &&
        segmentOnClipEdge(x1, y1, x2, y2, clipExtent, eps)
      ) {
        continue;
      }
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      if (maxEdge > 0 && len > maxEdge) {
        continue;
      }
      const nx = -dy / len;
      const ny = dx / len;
      const lx1 = toLocal(x1, grid.originX, grid.scaleX);
      const ly1 = toLocal(y1, grid.originY, grid.scaleY);
      const lx2 = toLocal(x2, grid.originX, grid.scaleX);
      const ly2 = toLocal(y2, grid.originY, grid.scaleY);
      const base = positions.length / 2;
      positions.push(lx1, ly1, lx1, ly1, lx2, ly2, lx2, ly2);
      attributes.push(
        nx,
        ny,
        width,
        d1,
        -nx,
        -ny,
        width,
        d1,
        nx,
        ny,
        width,
        d2,
        -nx,
        -ny,
        width,
        d2,
      );
      styleIndices.push(
        job.styleIndex,
        job.styleIndex,
        job.styleIndex,
        job.styleIndex,
      );
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
    offset = end;
  }
}

/**
 * Returns a function measuring a segment as it will be drawn. Coordinates the
 * GPU warps are run through the same grid it samples; where that grid has no
 * answer, the length before warping stands in.
 *
 * @param {import("./tessellate.js").TessellateOptions} reproj Options.
 * @return {function(number, number, number, number): number} Segment length.
 */
function drawnSegmentLength(reproj) {
  const warpGrid = reproj.warpGrid;
  if (reproj.projectToTarget || !warpGrid?.usable || !reproj.warpExtent) {
    return (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  }
  const sample = warpGridSampler(warpGrid, reproj.warpExtent);
  const a = [0, 0];
  const b = [0, 0];
  return (x1, y1, x2, y2) =>
    sample(x1, y1, a) && sample(x2, y2, b)
      ? Math.hypot(b[0] - a[0], b[1] - a[1])
      : Math.hypot(x2 - x1, y2 - y1);
}

/**
 * @param {Array<number>} xy Flat x/y pairs.
 * @param {import("./tessellate.js").TessellateOptions} reproj Options.
 * @return {Array<number>|null} Target coordinates.
 */
function projectCoordinates(xy, reproj) {
  return projectFlatCoordinates(
    xy,
    reproj.projectToTarget,
    reproj.maxSegmentLength,
    reproj.maxSpanX,
  );
}
