/**
 * @module ol/reproj
 */
import {IMAGE_SMOOTHING_DISABLED} from './source/common.js';
import {assign} from './obj.js';
import {
  containsCoordinate,
  createEmpty,
  extend,
  forEachCorner,
  getCenter,
  getHeight,
  getTopLeft,
  getWidth,
} from './extent.js';
import {createCanvasContext2D} from './dom.js';
import {getPointResolution, transform} from './proj.js';
import {solveLinearSystem} from './math.js';

let brokenDiagonalRendering_;

/**
 * This draws a small triangle into a canvas by setting the triangle as the clip region
 * and then drawing a (too large) rectangle
 *
 * @param {CanvasRenderingContext2D} ctx The context in which to draw the triangle
 * @param {number} u1 The x-coordinate of the second point. The first point is 0,0.
 * @param {number} v1 The y-coordinate of the second point.
 * @param {number} u2 The x-coordinate of the third point.
 * @param {number} v2 The y-coordinate of the third point.
 */
function drawTestTriangle(ctx, u1, v1, u2, v2) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(u1, v1);
  ctx.lineTo(u2, v2);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.fillRect(0, 0, Math.max(u1, u2) + 1, Math.max(v1, v2));
  ctx.restore();
}

/**
 * Given the data from getImageData, see if the right values appear at the provided offset.
 * Returns true if either the color or transparency is off
 *
 * @param {Uint8ClampedArray} data The data returned from getImageData
 * @param {number} offset The pixel offset from the start of data.
 * @return {boolean} true if the diagonal rendering is broken
 */
function verifyBrokenDiagonalRendering(data, offset) {
  // the values ought to be close to the rgba(210, 0, 0, 0.75)
  return (
    Math.abs(data[offset * 4] - 210) > 2 ||
    Math.abs(data[offset * 4 + 3] - 0.75 * 255) > 2
  );
}

/**
 * Determines if the current browser configuration can render triangular clip regions correctly.
 * This value is cached so the function is only expensive the first time called.
 * Firefox on Windows (as of now) does not if HWA is enabled. See https://bugzilla.mozilla.org/show_bug.cgi?id=1606976
 * IE also doesn't. Chrome works, and everything seems to work on OSX and Android. This function caches the
 * result. I suppose that it is conceivably possible that a browser might flip modes while the app is
 * running, but lets hope not.
 *
 * @return {boolean} true if the Diagonal Rendering is broken.
 */
function isBrokenDiagonalRendering() {
  if (brokenDiagonalRendering_ === undefined) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(210, 0, 0, 0.75)';
    drawTestTriangle(ctx, 4, 5, 4, 0);
    drawTestTriangle(ctx, 4, 5, 0, 5);
    const data = ctx.getImageData(0, 0, 3, 3).data;
    brokenDiagonalRendering_ =
      verifyBrokenDiagonalRendering(data, 0) ||
      verifyBrokenDiagonalRendering(data, 4) ||
      verifyBrokenDiagonalRendering(data, 8);
  }

  return brokenDiagonalRendering_;
}

/**
 * Calculates ideal resolution to use from the source in order to achieve
 * pixel mapping as close as possible to 1:1 during reprojection.
 * The resolution is calculated regardless of what resolutions
 * are actually available in the dataset (TileGrid, Image, ...).
 *
 * @param {import("./proj/Projection.js").default} sourceProj Source projection.
 * @param {import("./proj/Projection.js").default} targetProj Target projection.
 * @param {import("./coordinate.js").Coordinate} targetCenter Target center.
 * @param {number} targetResolution Target resolution.
 * @return {number} The best resolution to use. Can be +-Infinity, NaN or 0.
 */
export function calculateSourceResolution(
  sourceProj,
  targetProj,
  targetCenter,
  targetResolution
) {
  const sourceCenter = transform(targetCenter, targetProj, sourceProj);

  // calculate the ideal resolution of the source data
  let sourceResolution = getPointResolution(
    targetProj,
    targetResolution,
    targetCenter
  );

  const targetMetersPerUnit = targetProj.getMetersPerUnit();
  if (targetMetersPerUnit !== undefined) {
    sourceResolution *= targetMetersPerUnit;
  }
  const sourceMetersPerUnit = sourceProj.getMetersPerUnit();
  if (sourceMetersPerUnit !== undefined) {
    sourceResolution /= sourceMetersPerUnit;
  }

  // Based on the projection properties, the point resolution at the specified
  // coordinates may be slightly different. We need to reverse-compensate this
  // in order to achieve optimal results.

  const sourceExtent = sourceProj.getExtent();
  if (!sourceExtent || containsCoordinate(sourceExtent, sourceCenter)) {
    const compensationFactor =
      getPointResolution(sourceProj, sourceResolution, sourceCenter) /
      sourceResolution;
    if (isFinite(compensationFactor) && compensationFactor > 0) {
      sourceResolution /= compensationFactor;
    }
  }

  return sourceResolution;
}

/**
 * Calculates ideal resolution to use from the source in order to achieve
 * pixel mapping as close as possible to 1:1 during reprojection.
 * The resolution is calculated regardless of what resolutions
 * are actually available in the dataset (TileGrid, Image, ...).
 *
 * @param {import("./proj/Projection.js").default} sourceProj Source projection.
 * @param {import("./proj/Projection.js").default} targetProj Target projection.
 * @param {import("./extent.js").Extent} targetExtent Target extent
 * @param {number} targetResolution Target resolution.
 * @return {number} The best resolution to use. Can be +-Infinity, NaN or 0.
 */
export function calculateSourceExtentResolution(
  sourceProj,
  targetProj,
  targetExtent,
  targetResolution
) {
  const targetCenter = getCenter(targetExtent);
  let sourceResolution = calculateSourceResolution(
    sourceProj,
    targetProj,
    targetCenter,
    targetResolution
  );

  if (!isFinite(sourceResolution) || sourceResolution <= 0) {
    forEachCorner(targetExtent, function (corner) {
      sourceResolution = calculateSourceResolution(
        sourceProj,
        targetProj,
        corner,
        targetResolution
      );
      return isFinite(sourceResolution) && sourceResolution > 0;
    });
  }

  return sourceResolution;
}

/**
 * @typedef {Object} ImageExtent
 * @property {import("./extent.js").Extent} extent Extent.
 * @property {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} image Image.
 */

/**
 * Renders the source data into new canvas based on the triangulation.
 *
 * @param {number} width Width of the canvas.
 * @param {number} height Height of the canvas.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} sourceResolution Source resolution.
 * @param {import("./extent.js").Extent} sourceExtent Extent of the data source.
 * @param {number} targetResolution Target resolution.
 * @param {import("./extent.js").Extent} targetExtent Target extent.
 * @param {import("./reproj/Triangulation.js").default} triangulation Calculated triangulation.
 * @param {Array<ImageExtent>} sources Array of sources.
 * @param {number} gutter Gutter of the sources.
 * @param {boolean} [opt_renderEdges] Render reprojection edges.
 * @param {object} [opt_contextOptions] Properties to set on the canvas context.
 * @return {HTMLCanvasElement} Canvas with reprojected data.
 */
export function render(
  width,
  height,
  pixelRatio,
  sourceResolution,
  sourceExtent,
  targetResolution,
  targetExtent,
  triangulation,
  sources,
  gutter,
  opt_renderEdges,
  opt_contextOptions
) {
  const context = createCanvasContext2D(
    Math.round(pixelRatio * width),
    Math.round(pixelRatio * height)
  );
  assign(context, opt_contextOptions);

  if (sources.length === 0) {
    return context.canvas;
  }

  context.scale(pixelRatio, pixelRatio);

  function pixelRound(value) {
    return Math.round(value * pixelRatio) / pixelRatio;
  }

  context.globalCompositeOperation = 'lighter';

  const sourceDataExtent = createEmpty();
  sources.forEach(function (src, i, arr) {
    extend(sourceDataExtent, src.extent);
  });

  const canvasWidthInUnits = getWidth(sourceDataExtent);
  const canvasHeightInUnits = getHeight(sourceDataExtent);
  const stitchContext = createCanvasContext2D(
    Math.round((pixelRatio * canvasWidthInUnits) / sourceResolution),
    Math.round((pixelRatio * canvasHeightInUnits) / sourceResolution)
  );
  assign(stitchContext, opt_contextOptions);

  const stitchScale = pixelRatio / sourceResolution;

  sources.forEach(function (src, i, arr) {
    const xPos = src.extent[0] - sourceDataExtent[0];
    const yPos = -(src.extent[3] - sourceDataExtent[3]);
    const srcWidth = getWidth(src.extent);
    const srcHeight = getHeight(src.extent);

    // This test should never fail -- but it does. Need to find a fix the upstream condition
    if (src.image.width > 0 && src.image.height > 0) {
      stitchContext.drawImage(
        src.image,
        gutter,
        gutter,
        src.image.width - 2 * gutter,
        src.image.height - 2 * gutter,
        xPos * stitchScale,
        yPos * stitchScale,
        srcWidth * stitchScale,
        srcHeight * stitchScale
      );
    }
  });

  const targetTopLeft = getTopLeft(targetExtent);

  triangulation.getTriangles().forEach(function (triangle, i, arr) {
    /* Calculate affine transform (src -> dst)
     * Resulting matrix can be used to transform coordinate
     * from `sourceProjection` to destination pixels.
     *
     * To optimize number of context calls and increase numerical stability,
     * we also do the following operations:
     * trans(-topLeftExtentCorner), scale(1 / targetResolution), scale(1, -1)
     * here before solving the linear system so [ui, vi] are pixel coordinates.
     *
     * Src points: xi, yi
     * Dst points: ui, vi
     * Affine coefficients: aij
     *
     * | x0 y0 1  0  0 0 |   |a00|   |u0|
     * | x1 y1 1  0  0 0 |   |a01|   |u1|
     * | x2 y2 1  0  0 0 | x |a02| = |u2|
     * |  0  0 0 x0 y0 1 |   |a10|   |v0|
     * |  0  0 0 x1 y1 1 |   |a11|   |v1|
     * |  0  0 0 x2 y2 1 |   |a12|   |v2|
     */
    const source = triangle.source;
    const target = triangle.target;
    let x0 = source[0][0],
      y0 = source[0][1];
    let x1 = source[1][0],
      y1 = source[1][1];
    let x2 = source[2][0],
      y2 = source[2][1];
    // Make sure that everything is on pixel boundaries
    const u0 = pixelRound((target[0][0] - targetTopLeft[0]) / targetResolution);
    const v0 = pixelRound(
      -(target[0][1] - targetTopLeft[1]) / targetResolution
    );
    const u1 = pixelRound((target[1][0] - targetTopLeft[0]) / targetResolution);
    const v1 = pixelRound(
      -(target[1][1] - targetTopLeft[1]) / targetResolution
    );
    const u2 = pixelRound((target[2][0] - targetTopLeft[0]) / targetResolution);
    const v2 = pixelRound(
      -(target[2][1] - targetTopLeft[1]) / targetResolution
    );

    // Shift all the source points to improve numerical stability
    // of all the subsequent calculations. The [x0, y0] is used here.
    // This is also used to simplify the linear system.
    const sourceNumericalShiftX = x0;
    const sourceNumericalShiftY = y0;
    x0 = 0;
    y0 = 0;
    x1 -= sourceNumericalShiftX;
    y1 -= sourceNumericalShiftY;
    x2 -= sourceNumericalShiftX;
    y2 -= sourceNumericalShiftY;

    const augmentedMatrix = [
      [x1, y1, 0, 0, u1 - u0],
      [x2, y2, 0, 0, u2 - u0],
      [0, 0, x1, y1, v1 - v0],
      [0, 0, x2, y2, v2 - v0],
    ];
    const affineCoefs = solveLinearSystem(augmentedMatrix);
    if (!affineCoefs) {
      return;
    }

    context.save();
    context.beginPath();

    if (
      isBrokenDiagonalRendering() ||
      opt_contextOptions === IMAGE_SMOOTHING_DISABLED
    ) {
      // Make sure that all lines are horizontal or vertical
      context.moveTo(u1, v1);
      // This is the diagonal line. Do it in 4 steps
      const steps = 4;
      const ud = u0 - u1;
      const vd = v0 - v1;
      for (let step = 0; step < steps; step++) {
        // Go horizontally
        context.lineTo(
          u1 + pixelRound(((step + 1) * ud) / steps),
          v1 + pixelRound((step * vd) / (steps - 1))
        );
        // Go vertically
        if (step != steps - 1) {
          context.lineTo(
            u1 + pixelRound(((step + 1) * ud) / steps),
            v1 + pixelRound(((step + 1) * vd) / (steps - 1))
          );
        }
      }
      // We are almost at u0r, v0r
      context.lineTo(u2, v2);
    } else {
      context.moveTo(u1, v1);
      context.lineTo(u0, v0);
      context.lineTo(u2, v2);
    }

    context.clip();

    context.transform(
      affineCoefs[0],
      affineCoefs[2],
      affineCoefs[1],
      affineCoefs[3],
      u0,
      v0
    );

    context.translate(
      sourceDataExtent[0] - sourceNumericalShiftX,
      sourceDataExtent[3] - sourceNumericalShiftY
    );

    context.scale(
      sourceResolution / pixelRatio,
      -sourceResolution / pixelRatio
    );

    context.drawImage(stitchContext.canvas, 0, 0);
    context.restore();
  });

  if (opt_renderEdges) {
    context.save();

    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = 'black';
    context.lineWidth = 1;

    triangulation.getTriangles().forEach(function (triangle, i, arr) {
      const target = triangle.target;
      const u0 = (target[0][0] - targetTopLeft[0]) / targetResolution;
      const v0 = -(target[0][1] - targetTopLeft[1]) / targetResolution;
      const u1 = (target[1][0] - targetTopLeft[0]) / targetResolution;
      const v1 = -(target[1][1] - targetTopLeft[1]) / targetResolution;
      const u2 = (target[2][0] - targetTopLeft[0]) / targetResolution;
      const v2 = -(target[2][1] - targetTopLeft[1]) / targetResolution;

      context.beginPath();
      context.moveTo(u1, v1);
      context.lineTo(u0, v0);
      context.lineTo(u2, v2);
      context.closePath();
      context.stroke();
    });

    context.restore();
  }
  return context.canvas;
}
