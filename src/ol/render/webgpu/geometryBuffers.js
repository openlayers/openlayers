/**
 * @module ol/render/webgpu/geometryBuffers
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
 * @property {CanvasLineCap} [lineCap] Stroke cap.
 * @property {CanvasLineJoin} [lineJoin] Stroke join.
 * @property {number} [miterLimit] Stroke miter limit.
 * @property {boolean} [closed] Whether the stroke is a closed ring.
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
 * @property {Float32Array} strokeAttributes Extrusion x, extrusion y, width,
 *     and distance along the line in drawn map units, per stroke vertex. The
 *     sign of the width tells the side of the line the vertex is on, so the
 *     shader can fade out the edges.
 * @property {Uint32Array} strokeStyles Style index per stroke vertex.
 * @property {Uint32Array} strokeIndices Stroke indices.
 * @property {Float32Array} styles Styles, `STYLE_STRIDE` floats each (see `buffers.js`).
 * @property {LocalGrid} grid Grid the positions are expressed in.
 * @property {Array<import("./drawOrder.js").DrawCommand>} ranges Index ranges in draw order.
 */

/**
 * Whole worlds to add to an x coordinate so it lands in the world copy
 * nearest the grid. A view straddling the antimeridian gets a grid that runs
 * past the edge of the world, and geometry on the far side has to move in, as
 * do the symbols and labels drawn for it. Geometry half a world away is as
 * near in either direction, and stays where it is.
 *
 * @param {number} centerX Center of what is shifted, in source units.
 * @param {number} gridCenterX Center of the grid, in source units.
 * @param {number} worldWidth Source world width, 0 when the source does not wrap.
 * @return {number} Shift in source units.
 */
export function worldShift(centerX, gridCenterX, worldWidth) {
  if (!(worldWidth > 0)) {
    return 0;
  }
  const worlds = (gridCenterX - centerX) / worldWidth;
  return worldWidth * Math.sign(worlds) * Math.ceil(Math.abs(worlds) - 0.5);
}

/**
 * Shifts that place a geometry in every world copy the grid covers.
 *
 * The nearest copy is always included. A grid wider than one world also gets
 * the copies on either side, so a view that shows the world more than once
 * draws the feature in each of them. A copy that misses the grid is left out.
 *
 * @param {number} minX Minimum x of the geometry, before shifting.
 * @param {number} maxX Maximum x of the geometry, before shifting.
 * @param {number} gridCenterX Center of the grid.
 * @param {number} gridMinX Minimum x of the grid.
 * @param {number} gridMaxX Maximum x of the grid.
 * @param {number} worldWidth Source world width, 0 when the source does not wrap.
 * @return {Array<number>} Shifts in source units.
 */
export function worldCopyShifts(
  minX,
  maxX,
  gridCenterX,
  gridMinX,
  gridMaxX,
  worldWidth,
) {
  const nearest = worldShift((minX + maxX) / 2, gridCenterX, worldWidth);
  if (!(worldWidth > 0)) {
    return [nearest];
  }
  const shiftedMin = minX + nearest;
  const shiftedMax = maxX + nearest;
  /** @type {Array<number>} */
  const shifts = [];
  const kMin = Math.floor((gridMinX - shiftedMax) / worldWidth) - 1;
  const kMax = Math.ceil((gridMaxX - shiftedMin) / worldWidth) + 1;
  for (let k = kMin; k <= kMax; ++k) {
    const shift = nearest + k * worldWidth;
    const copyMin = minX + shift;
    const copyMax = maxX + shift;
    if (copyMax >= gridMinX && copyMin <= gridMaxX) {
      shifts.push(shift);
    }
  }
  return shifts.length > 0 ? shifts : [nearest];
}

/**
 * Turn tessellation jobs into the typed arrays the WebGPU vector pipelines
 * consume. Nothing here touches features, styles, or the DOM, so the same code
 * runs on the main thread and inside {@link module:ol/worker/webgpuvector}.
 *
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
    // Per geometry rather than per point, so shapes that cross the edge
    // themselves stay in one piece. A grid wider than one world is drawn
    // once per copy it covers.
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < xy.length; i += 2) {
      minX = Math.min(minX, xy[i]);
      maxX = Math.max(maxX, xy[i]);
    }
    const shifts = worldCopyShifts(
      minX,
      maxX,
      gridCenterX,
      request.gridExtent[0],
      request.gridExtent[2],
      worldWidth,
    );
    for (const shift of shifts) {
      const placed =
        shift === 0
          ? xy
          : xy.map((value, index) => (index % 2 === 0 ? value + shift : value));
      if (job.kind === 'fill') {
        const indexStart = fillIndices.length;
        emitFill(
          placed,
          job,
          grid,
          reproj,
          fillPositions,
          fillStyles,
          fillIndices,
        );
        pushRange(ranges, job, indexStart, fillIndices.length - indexStart);
      } else {
        const indexStart = strokeIndices.length;
        emitStroke(
          placed,
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
    styleIndex: job.styleIndex,
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
 * Emits a connected strip with cap and join geometry. Each vertex carries an
 * extrusion vector and its distance along the line for the dash pattern.
 * Distances are measured where the line is drawn: after the GPU warp when
 * there is one, so dashes keep their length on screen. They start again at
 * zero for each part a clip cuts the line into, and keep counting across
 * segments that are left out.
 *
 * @param {Array<number>} xy Flat x/y pairs.
 * @param {GeometryJob} job Job.
 * @param {LocalGrid} grid Grid.
 * @param {import("./tessellate.js").TessellateOptions} reproj Tessellation options.
 * @param {Array<number>} positions Positions out.
 * @param {Array<number>} attributes Extrusion x, extrusion y, width, and distance out.
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
  const eps = clipExtent ? clipEdgeEpsilon(clipExtent) : 0;
  const maxEdge = reproj.maxTargetEdge || 0;
  const drawnLength = drawnSegmentLength(reproj);
  let offset = 0;
  for (const end of ends) {
    /** @type {Array<{x: number, y: number, distance: number}>} */
    let run = [];
    let distance = 0;
    const partStart = offset;
    const partClosed =
      !!job.closed &&
      parts[offset] === parts[end - 2] &&
      parts[offset + 1] === parts[end - 1];
    const realStart =
      !clipExtent ||
      (parts[offset] === projected[0] && parts[offset + 1] === projected[1]);
    const realEnd =
      !clipExtent ||
      (parts[end - 2] === projected[projected.length - 2] &&
        parts[end - 1] === projected[projected.length - 1]);
    for (let i = offset; i < end - 2; i += 2) {
      const x1 = parts[i];
      const y1 = parts[i + 1];
      const x2 = parts[i + 2];
      const y2 = parts[i + 3];
      const d1 = distance;
      distance += drawnLength(x1, y1, x2, y2);
      const d2 = distance;
      const skipped =
        (job.skipClipEdges &&
          clipExtent &&
          segmentOnClipEdge(x1, y1, x2, y2, clipExtent, eps)) ||
        (maxEdge > 0 && Math.hypot(x2 - x1, y2 - y1) > maxEdge);
      if (skipped) {
        emitStrokeRun(
          run,
          false,
          'butt',
          'butt',
          job,
          grid,
          positions,
          attributes,
          styleIndices,
          indices,
        );
        run = [];
        continue;
      }
      if (!run.length) {
        run.push({x: x1, y: y1, distance: d1});
      }
      if (run[run.length - 1].x !== x2 || run[run.length - 1].y !== y2) {
        run.push({x: x2, y: y2, distance: d2});
      }
    }
    if (run.length >= 2) {
      const startsAtPart =
        run[0].x === parts[partStart] && run[0].y === parts[partStart + 1];
      const endsAtPart =
        run[run.length - 1].x === parts[end - 2] &&
        run[run.length - 1].y === parts[end - 1];
      emitStrokeRun(
        run,
        partClosed && startsAtPart && endsAtPart,
        startsAtPart && realStart ? job.lineCap || 'round' : 'butt',
        endsAtPart && realEnd ? job.lineCap || 'round' : 'butt',
        job,
        grid,
        positions,
        attributes,
        styleIndices,
        indices,
      );
    }
    offset = end;
  }
}

/**
 * @typedef {{x: number, y: number, distance: number}} StrokePoint
 */

/**
 * @typedef {{x: number, y: number}} StrokeVector
 */

/**
 * @typedef {Object} StrokeMeshWriter
 * @property {function(number, number, number, number, number, number): number} vertex Add a
 * vertex on the left (1) or right (-1) edge of the line. Vertices on the
 * centerline, without extrusion, may give either side.
 * @property {function(number, number, number, number, number, number, number): Array<number>} pair Add a left/right pair.
 * @property {function(number, number, number): void} triangle Add a triangle.
 * @property {number} left Last left-side vertex.
 * @property {number} right Last right-side vertex.
 */

/**
 * @param {Array<StrokePoint>} input Points.
 * @param {boolean} closed Closed ring.
 * @param {CanvasLineCap} startCap Start cap.
 * @param {CanvasLineCap} endCap End cap.
 * @param {GeometryJob} job Job.
 * @param {LocalGrid} grid Grid.
 * @param {Array<number>} positions Positions out.
 * @param {Array<number>} attributes Attributes out.
 * @param {Array<number>} styleIndices Style indices out.
 * @param {Array<number>} indices Indices out.
 */
function emitStrokeRun(
  input,
  closed,
  startCap,
  endCap,
  job,
  grid,
  positions,
  attributes,
  styleIndices,
  indices,
) {
  const points = [];
  for (const point of input) {
    const last = points[points.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) {
      points.push(point);
    } else {
      last.distance = point.distance;
    }
  }
  if (points.length < 2) {
    return;
  }
  const width = job.width || 1;
  const writer = createStrokeMeshWriter(
    job.styleIndex,
    width,
    grid,
    positions,
    attributes,
    styleIndices,
    indices,
  );
  /**
   * @param {StrokePoint} a Start.
   * @param {StrokePoint} b End.
   * @return {StrokeVector} Left normal.
   */
  const normal = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    return length ? {x: -dy / length, y: dx / length} : {x: 0, y: 1};
  };
  const firstNormal = normal(points[0], points[1]);
  const first = points[0];
  addCapPair(writer, first, firstNormal, closed ? 'butt' : startCap, -1);
  if (!closed && startCap === 'round') {
    addRoundCap(writer, first, firstNormal, -1);
  }
  for (let i = 1; i < points.length - 1; ++i) {
    addJoin(
      writer,
      points[i],
      normal(points[i - 1], points[i]),
      normal(points[i], points[i + 1]),
      job.lineJoin || 'round',
      job.miterLimit ?? 10,
    );
  }
  const last = points[points.length - 1];
  const lastNormal = normal(points[points.length - 2], last);
  if (closed) {
    addJoin(
      writer,
      last,
      lastNormal,
      firstNormal,
      job.lineJoin || 'round',
      job.miterLimit ?? 10,
    );
  } else {
    addCapPair(writer, last, lastNormal, endCap, 1);
    if (endCap === 'round') {
      addRoundCap(writer, last, lastNormal, 1);
    }
  }
}

/**
 * @param {number} styleIndex Style index.
 * @param {number} width Width.
 * @param {LocalGrid} grid Grid.
 * @param {Array<number>} positions Positions out.
 * @param {Array<number>} attributes Attributes out.
 * @param {Array<number>} styleIndices Style indices out.
 * @param {Array<number>} indices Indices out.
 * @return {StrokeMeshWriter} Writer.
 */
function createStrokeMeshWriter(
  styleIndex,
  width,
  grid,
  positions,
  attributes,
  styleIndices,
  indices,
) {
  const writer = /** @type {StrokeMeshWriter} */ ({
    left: -1,
    right: -1,
    vertex(x, y, ex, ey, distance, side) {
      const index = positions.length / 2;
      positions.push(
        toLocal(x, grid.originX, grid.scaleX),
        toLocal(y, grid.originY, grid.scaleY),
      );
      attributes.push(ex, ey, width * side, distance);
      styleIndices.push(styleIndex);
      return index;
    },
    pair(x, y, lx, ly, rx, ry, distance) {
      const left = writer.vertex(x, y, lx, ly, distance, 1);
      const right = writer.vertex(x, y, rx, ry, distance, -1);
      if (writer.left >= 0 && writer.right >= 0) {
        indices.push(
          writer.left,
          left,
          writer.right,
          left,
          right,
          writer.right,
        );
      }
      writer.left = left;
      writer.right = right;
      return [left, right];
    },
    triangle(a, b, c) {
      indices.push(a, b, c);
    },
  });
  return writer;
}

/**
 * @param {StrokeMeshWriter} writer Writer.
 * @param {StrokePoint} point Point.
 * @param {StrokeVector} normal Left normal.
 * @param {CanvasLineCap} cap Cap.
 * @param {number} direction Start (-1) or end (1).
 */
function addCapPair(writer, point, normal, cap, direction) {
  const extension = cap === 'square' ? direction : 0;
  const tx = normal.y;
  const ty = -normal.x;
  writer.pair(
    point.x,
    point.y,
    normal.x + tx * extension,
    normal.y + ty * extension,
    -normal.x + tx * extension,
    -normal.y + ty * extension,
    point.distance,
  );
}

/**
 * @param {StrokeMeshWriter} writer Writer.
 * @param {StrokePoint} point Point.
 * @param {StrokeVector} normal Left normal.
 * @param {number} direction Start (-1) or end (1).
 */
function addRoundCap(writer, point, normal, direction) {
  const center = writer.vertex(point.x, point.y, 0, 0, point.distance, 1);
  const tx = normal.y;
  const ty = -normal.x;
  const steps = 9;
  let previous;
  for (let i = 0; i <= steps; ++i) {
    const angle = (i / steps) * Math.PI;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const ex = direction < 0 ? -normal.x * c - tx * s : normal.x * c + tx * s;
    const ey = direction < 0 ? -normal.y * c - ty * s : normal.y * c + ty * s;
    const current = writer.vertex(point.x, point.y, ex, ey, point.distance, 1);
    if (previous !== undefined) {
      writer.triangle(center, previous, current);
    }
    previous = current;
  }
}

/**
 * @param {StrokeMeshWriter} writer Writer.
 * @param {StrokePoint} point Point.
 * @param {StrokeVector} previous Previous left normal.
 * @param {StrokeVector} next Next left normal.
 * @param {CanvasLineJoin} join Join.
 * @param {number} miterLimit Miter limit.
 */
function addJoin(writer, point, previous, next, join, miterLimit) {
  const dot = Math.max(
    -1,
    Math.min(1, previous.x * next.x + previous.y * next.y),
  );
  const cross = previous.x * next.y - previous.y * next.x;
  if (dot > 1 - 1e-12) {
    writer.pair(
      point.x,
      point.y,
      next.x,
      next.y,
      -next.x,
      -next.y,
      point.distance,
    );
    return;
  }
  const sumX = previous.x + next.x;
  const sumY = previous.y + next.y;
  const sumLength = Math.hypot(sumX, sumY);
  const joinX = sumLength ? sumX / sumLength : 0;
  const joinY = sumLength ? sumY / sumLength : 0;
  const cosHalf = joinX * next.x + joinY * next.y;
  const miterLength = cosHalf > 1e-12 ? 1 / cosHalf : Infinity;
  if (join === 'miter' && miterLength <= Math.max(0, miterLimit)) {
    writer.pair(
      point.x,
      point.y,
      joinX * miterLength,
      joinY * miterLength,
      -joinX * miterLength,
      -joinY * miterLength,
      point.distance,
    );
    return;
  }

  const turnsLeft = cross >= 0;
  const angle = Math.atan2(cross, dot);
  // Beyond two half-widths the inner miter lies outside the stroke, and the
  // triangles back to it cover the exterior as well as the line.
  if (miterLength > 2) {
    writer.pair(
      point.x,
      point.y,
      previous.x,
      previous.y,
      -previous.x,
      -previous.y,
      point.distance,
    );
    addOuterJoin(writer, point, previous, angle, turnsLeft, join);
    writer.left = writer.vertex(
      point.x,
      point.y,
      next.x,
      next.y,
      point.distance,
      1,
    );
    writer.right = writer.vertex(
      point.x,
      point.y,
      -next.x,
      -next.y,
      point.distance,
      -1,
    );
    return;
  }

  const innerX = joinX * miterLength * (turnsLeft ? 1 : -1);
  const innerY = joinY * miterLength * (turnsLeft ? 1 : -1);
  const previousOuterX = turnsLeft ? -previous.x : previous.x;
  const previousOuterY = turnsLeft ? -previous.y : previous.y;
  if (turnsLeft) {
    writer.pair(
      point.x,
      point.y,
      innerX,
      innerY,
      previousOuterX,
      previousOuterY,
      point.distance,
    );
  } else {
    writer.pair(
      point.x,
      point.y,
      previousOuterX,
      previousOuterY,
      innerX,
      innerY,
      point.distance,
    );
  }

  addOuterJoin(writer, point, previous, angle, turnsLeft, join);
}

/**
 * @param {StrokeMeshWriter} writer Writer.
 * @param {StrokePoint} point Point.
 * @param {StrokeVector} previous Previous left normal.
 * @param {number} angle Signed turn from the previous normal to the next.
 * @param {boolean} turnsLeft The line turns left.
 * @param {CanvasLineJoin} join Join.
 */
function addOuterJoin(writer, point, previous, angle, turnsLeft, join) {
  const previousOuterX = turnsLeft ? -previous.x : previous.x;
  const previousOuterY = turnsLeft ? -previous.y : previous.y;
  const steps =
    join === 'round'
      ? Math.max(1, Math.ceil(Math.abs(angle) / (Math.PI / 9)))
      : 1;
  const hub = turnsLeft ? writer.left : writer.right;
  let outerIndex = turnsLeft ? writer.right : writer.left;
  for (let i = 1; i <= steps; ++i) {
    const currentAngle = (angle * i) / steps;
    const c = Math.cos(currentAngle);
    const s = Math.sin(currentAngle);
    const ex = previousOuterX * c - previousOuterY * s;
    const ey = previousOuterX * s + previousOuterY * c;
    const current = writer.vertex(
      point.x,
      point.y,
      ex,
      ey,
      point.distance,
      turnsLeft ? -1 : 1,
    );
    if (turnsLeft) {
      writer.triangle(hub, outerIndex, current);
      writer.right = current;
    } else {
      writer.triangle(hub, current, outerIndex);
      writer.left = current;
    }
    outerIndex = current;
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
