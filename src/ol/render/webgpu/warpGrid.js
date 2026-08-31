/**
 * @module ol/render/webgpu/warpGrid
 *
 * A coarse sampling of a projection, used to warp vector geometry on the GPU.
 *
 * Running proj4 per vertex is what made reprojected vector layers stall while
 * zooming. Instead the transform is sampled on a small grid over the batch
 * extent, and the GPU interpolates between those samples. Bilinear
 * interpolation of a smooth projection converges quadratically, so error falls
 * by about four per grid refinement: at sixteen cells across a tile-sized
 * extent it is well under a tenth of a pixel.
 *
 * The grid is a function of the two projections and the extent only, never of
 * the camera, so panning and zooming reuse it.
 */
import {LOCAL_EXTENT} from './localGrid.js';

/**
 * Floats per grid node: target x, target y, valid flag, and padding to keep the
 * vec4 alignment a storage buffer wants.
 * @type {number}
 */
export const WARP_NODE_STRIDE = 4;

/**
 * @typedef {Object} WarpGrid
 * @property {Float32Array} nodes Target offsets from `origin`, valid flag, padding.
 * @property {number} cells Cells along each edge.
 * @property {number} cellSize Local grid units per cell, the same on both axes
 *     because the local grid normalizes each axis to LOCAL_EXTENT.
 * @property {Array<number>} unitsPerCell Source map units per cell, per axis.
 * @property {Array<number>} origin Target origin the node offsets are relative to.
 * @property {number} maxEdge Target distance above which a cell is treated as a projection cut.
 * @property {boolean} usable At least one node projected successfully.
 */

/**
 * Cells to start from, and the point at which refining stops paying for
 * itself. A 256 cell grid is 66k samples, which only a whole-world extent in a
 * strongly curved projection should ever reach.
 */
const MIN_CELLS = 16;
const MAX_CELLS = 256;

/**
 * Interpolation error budget, as a fraction of the grid's target span. Cell
 * centres are only a sample of the true maximum, so the budget is tighter than
 * the accuracy actually being aimed for: about a tenth of a pixel for a grid
 * drawn across 1024 pixels.
 * @type {number}
 */
const ERROR_FRACTION = 1 / 16384;

/**
 * Largest gap between the interpolated and the real projection, sampled at
 * cell centres where bilinear error peaks.
 *
 * @param {WarpGrid} grid Grid.
 * @param {import("../../extent.js").Extent} extent Source extent.
 * @param {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} projectToTarget Source to target.
 * @return {number} Error in target units.
 */
function centreError(grid, extent, projectToTarget) {
  const cells = grid.cells;
  const stepX = grid.unitsPerCell[0];
  const stepY = grid.unitsPerCell[1];
  const stride = cells + 1;
  // Sampling every cell of a fine grid costs as much as building it, so this
  // walks a bounded subset.
  const skip = Math.max(1, Math.floor(cells / 16));
  let worst = 0;
  for (let j = 0; j + 1 <= cells; j += skip) {
    for (let i = 0; i + 1 <= cells; i += skip) {
      const a = (j * stride + i) * WARP_NODE_STRIDE;
      const b = (j * stride + i + 1) * WARP_NODE_STRIDE;
      const c = ((j + 1) * stride + i) * WARP_NODE_STRIDE;
      const d = ((j + 1) * stride + i + 1) * WARP_NODE_STRIDE;
      if (
        grid.nodes[a + 2] < 0.5 ||
        grid.nodes[b + 2] < 0.5 ||
        grid.nodes[c + 2] < 0.5 ||
        grid.nodes[d + 2] < 0.5
      ) {
        continue;
      }
      const exact = projectToTarget([
        extent[0] + (i + 0.5) * stepX,
        extent[1] + (j + 0.5) * stepY,
      ]);
      if (!exact) {
        continue;
      }
      const x =
        grid.origin[0] +
        (grid.nodes[a] + grid.nodes[b] + grid.nodes[c] + grid.nodes[d]) / 4;
      const y =
        grid.origin[1] +
        (grid.nodes[a + 1] +
          grid.nodes[b + 1] +
          grid.nodes[c + 1] +
          grid.nodes[d + 1]) /
          4;
      worst = Math.max(worst, Math.hypot(x - exact[0], y - exact[1]));
    }
  }
  return worst;
}

/**
 * Sample the projection over `extent`, refining until interpolating the result
 * is accurate enough. Error falls about fourfold per refinement, so this
 * settles after one or two steps.
 *
 * @param {import("../../extent.js").Extent} extent Source extent the batch's local grid covers.
 * @param {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} projectToTarget Source to target.
 * @param {number} maxEdge Target distance above which a cell spans a projection cut.
 * @return {WarpGrid} Grid.
 */
export function buildWarpGrid(extent, projectToTarget, maxEdge) {
  let cells = MIN_CELLS;
  let grid = sampleWarpGrid(extent, projectToTarget, cells, maxEdge);
  if (!grid.usable) {
    return grid;
  }
  let span = 0;
  for (let i = 0; i < grid.nodes.length; i += WARP_NODE_STRIDE) {
    span = Math.max(span, Math.abs(grid.nodes[i]), Math.abs(grid.nodes[i + 1]));
  }
  const tolerance = span * 2 * ERROR_FRACTION;
  while (
    cells < MAX_CELLS &&
    centreError(grid, extent, projectToTarget) > tolerance
  ) {
    cells *= 2;
    grid = sampleWarpGrid(extent, projectToTarget, cells, maxEdge);
  }
  return grid;
}

/**
 * @param {import("../../extent.js").Extent} extent Source extent the batch's local grid covers.
 * @param {function(import("../../coordinate.js").Coordinate): (import("../../coordinate.js").Coordinate|null)} projectToTarget Source to target.
 * @param {number} cells Cells per edge.
 * @param {number} maxEdge Target distance above which a cell spans a projection cut.
 * @return {WarpGrid} Grid.
 */
export function sampleWarpGrid(extent, projectToTarget, cells, maxEdge) {
  // The batch's local grid normalizes each axis of `extent` to LOCAL_EXTENT
  // units, so the warp grid covers the same rectangle, one axis at a time.
  const stepX = (extent[2] - extent[0]) / cells;
  const stepY = (extent[3] - extent[1]) / cells;
  const nodes = new Float32Array((cells + 1) * (cells + 1) * WARP_NODE_STRIDE);
  /** @type {Array<number>} */
  const targets = [];
  let originX = 0;
  let originY = 0;
  let valid = 0;

  for (let j = 0; j <= cells; ++j) {
    for (let i = 0; i <= cells; ++i) {
      const projected = projectToTarget([
        extent[0] + i * stepX,
        extent[1] + j * stepY,
      ]);
      if (projected && isFinite(projected[0]) && isFinite(projected[1])) {
        targets.push(projected[0], projected[1]);
        originX += projected[0];
        originY += projected[1];
        ++valid;
      } else {
        targets.push(NaN, NaN);
      }
    }
  }

  if (!valid) {
    return {
      nodes,
      cells,
      cellSize: LOCAL_EXTENT / cells,
      unitsPerCell: [stepX, stepY],
      origin: [0, 0],
      maxEdge,
      usable: false,
    };
  }

  // Node offsets are stored relative to the mean of the valid samples: target
  // coordinates reach 1e7 metres, where float32 only resolves a metre or two.
  originX /= valid;
  originY /= valid;
  for (let n = 0; n < targets.length / 2; ++n) {
    const x = targets[n * 2];
    const y = targets[n * 2 + 1];
    const offset = n * WARP_NODE_STRIDE;
    const ok = isFinite(x) && isFinite(y);
    nodes[offset] = ok ? x - originX : 0;
    nodes[offset + 1] = ok ? y - originY : 0;
    nodes[offset + 2] = ok ? 1 : 0;
    nodes[offset + 3] = 0;
  }

  return {
    nodes,
    cells,
    cellSize: LOCAL_EXTENT / cells,
    unitsPerCell: [stepX, stepY],
    origin: [originX, originY],
    maxEdge,
    usable: true,
  };
}

/**
 * Read the grid the way the shader does, so whoever prepares the geometry and
 * the GPU that draws it agree on where a vertex lands.
 *
 * @param {WarpGrid} grid Grid.
 * @param {import("../../extent.js").Extent} extent Source extent the grid covers.
 * @return {function(number, number, Array<number>): boolean} Writes the target
 *     position into the given pair, or returns false where the projection has
 *     no answer.
 */
export function warpGridSampler(grid, extent) {
  const cells = grid.cells;
  const stride = cells + 1;
  const nodes = grid.nodes;
  const stepX = grid.unitsPerCell[0];
  const stepY = grid.unitsPerCell[1];
  const originX = grid.origin[0];
  const originY = grid.origin[1];
  const last = cells - 1e-6;

  return function (x, y, out) {
    const gx = Math.min(Math.max((x - extent[0]) / stepX, 0), last);
    const gy = Math.min(Math.max((y - extent[1]) / stepY, 0), last);
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    const fx = gx - ix;
    const fy = gy - iy;
    const a = (iy * stride + ix) * WARP_NODE_STRIDE;
    const b = (iy * stride + ix + 1) * WARP_NODE_STRIDE;
    const c = ((iy + 1) * stride + ix) * WARP_NODE_STRIDE;
    const d = ((iy + 1) * stride + ix + 1) * WARP_NODE_STRIDE;
    if (
      nodes[a + 2] < 0.5 ||
      nodes[b + 2] < 0.5 ||
      nodes[c + 2] < 0.5 ||
      nodes[d + 2] < 0.5
    ) {
      return false;
    }
    const bottomX = nodes[a] + (nodes[b] - nodes[a]) * fx;
    const bottomY = nodes[a + 1] + (nodes[b + 1] - nodes[a + 1]) * fx;
    const topX = nodes[c] + (nodes[d] - nodes[c]) * fx;
    const topY = nodes[c + 1] + (nodes[d + 1] - nodes[c + 1]) * fx;
    out[0] = originX + bottomX + (topX - bottomX) * fy;
    out[1] = originY + bottomY + (topY - bottomY) * fy;
    return true;
  };
}

/**
 * @param {import("../../tilecoord.js").TileCoord|null} tileCoord Tile, when there is one.
 * @param {import("../../extent.js").Extent} extent Source extent.
 * @param {import("../../proj/Projection.js").default} sourceProj Source projection.
 * @param {import("../../proj/Projection.js").default} targetProj Target projection.
 * @return {string} Cache key, with no camera state in it.
 */
export function warpGridKey(tileCoord, extent, sourceProj, targetProj) {
  return [
    tileCoord ? tileCoord.join('/') : extent.map((v) => v.toFixed(3)).join(','),
    sourceProj.getCode(),
    targetProj.getCode(),
  ].join('|');
}
