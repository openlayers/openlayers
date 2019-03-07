/**
 * @module ol/reproj
 */
import {createCanvasContext2D} from './dom.js';
import {containsCoordinate, createEmpty, extend, getHeight, getTopLeft, getWidth} from './extent.js';
import {solveLinearSystem} from './math.js';
import {getPointResolution, transform} from './proj.js';


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
export function calculateSourceResolution(sourceProj, targetProj,
  targetCenter, targetResolution) {

  const sourceCenter = transform(targetCenter, targetProj, sourceProj);

  // calculate the ideal resolution of the source data
  let sourceResolution = getPointResolution(targetProj, targetResolution, targetCenter);

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
    const compensationFactor = getPointResolution(sourceProj, sourceResolution, sourceCenter) /
        sourceResolution;
    if (isFinite(compensationFactor) && compensationFactor > 0) {
      sourceResolution /= compensationFactor;
    }
  }

  return sourceResolution;
}


/**
 * Enlarge the clipping triangle point by 1 pixel to ensure the edges overlap
 * in order to mask gaps caused by antialiasing.
 *
 * @param {number} centroidX Centroid of the triangle (x coordinate in pixels).
 * @param {number} centroidY Centroid of the triangle (y coordinate in pixels).
 * @param {number} x X coordinate of the point (in pixels).
 * @param {number} y Y coordinate of the point (in pixels).
 * @return {import("./coordinate.js").Coordinate} New point 1 px farther from the centroid.
 */
function enlargeClipPoint(centroidX, centroidY, x, y) {
  const dX = x - centroidX;
  const dY = y - centroidY;
  const distance = Math.sqrt(dX * dX + dY * dY);
  return [Math.round(x + dX / distance), Math.round(y + dY / distance)];
}


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
 * @param {import("./reproj/Triangulation.js").default} triangulation
 * Calculated triangulation.
 * @param {Array<{extent: import("./extent.js").Extent,
 *                 image: (HTMLCanvasElement|HTMLImageElement|HTMLVideoElement)}>} sources
 * Array of sources.
 * @param {number} gutter Gutter of the sources.
 * @param {boolean=} opt_renderEdges Render reprojection edges.
 * @return {HTMLCanvasElement} Canvas with reprojected data.
 */
export function render(width, height, pixelRatio,
  sourceResolution, sourceExtent, targetResolution, targetExtent,
  triangulation, sources, gutter, opt_renderEdges) {

  const context = createCanvasContext2D(Math.round(pixelRatio * width),
    Math.round(pixelRatio * height));

  if (sources.length === 0) {
    return context.canvas;
  }

  context.scale(pixelRatio, pixelRatio);

  const sourceDataExtent = createEmpty();
  sources.forEach(function(src, i, arr) {
    extend(sourceDataExtent, src.extent);
  });

  const canvasWidthInUnits = getWidth(sourceDataExtent);
  const canvasHeightInUnits = getHeight(sourceDataExtent);
  const stitchContext = createCanvasContext2D(
    Math.round(pixelRatio * canvasWidthInUnits / sourceResolution),
    Math.round(pixelRatio * canvasHeightInUnits / sourceResolution));

  const stitchScale = pixelRatio / sourceResolution;

  sources.forEach(function(src, i, arr) {
    const xPos = src.extent[0] - sourceDataExtent[0];
    const yPos = -(src.extent[3] - sourceDataExtent[3]);
    const srcWidth = getWidth(src.extent);
    const srcHeight = getHeight(src.extent);

    stitchContext.drawImage(
      src.image,
      gutter, gutter,
      src.image.width - 2 * gutter, src.image.height - 2 * gutter,
      xPos * stitchScale, yPos * stitchScale,
      srcWidth * stitchScale, srcHeight * stitchScale);
  });

  const targetTopLeft = getTopLeft(targetExtent);

  triangulation.getTriangles().forEach(function(triangle, i, arr) {
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
    let x0 = source[0][0], y0 = source[0][1];
    let x1 = source[1][0], y1 = source[1][1];
    let x2 = source[2][0], y2 = source[2][1];
    const u0 = (target[0][0] - targetTopLeft[0]) / targetResolution;
    const v0 = -(target[0][1] - targetTopLeft[1]) / targetResolution;
    const u1 = (target[1][0] - targetTopLeft[0]) / targetResolution;
    const v1 = -(target[1][1] - targetTopLeft[1]) / targetResolution;
    const u2 = (target[2][0] - targetTopLeft[0]) / targetResolution;
    const v2 = -(target[2][1] - targetTopLeft[1]) / targetResolution;

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
      [0, 0, x2, y2, v2 - v0]
    ];
    const affineCoefs = solveLinearSystem(augmentedMatrix);
    if (!affineCoefs) {
      return;
    }

    context.save();
    context.beginPath();
    const centroidX = (u0 + u1 + u2) / 3;
    const centroidY = (v0 + v1 + v2) / 3;
    const p0 = enlargeClipPoint(centroidX, centroidY, u0, v0);
    const p1 = enlargeClipPoint(centroidX, centroidY, u1, v1);
    const p2 = enlargeClipPoint(centroidX, centroidY, u2, v2);

    context.moveTo(p1[0], p1[1]);
    context.lineTo(p0[0], p0[1]);
    context.lineTo(p2[0], p2[1]);
    context.clip();

    context.transform(
      affineCoefs[0], affineCoefs[2], affineCoefs[1], affineCoefs[3], u0, v0);

    context.translate(sourceDataExtent[0] - sourceNumericalShiftX,
      sourceDataExtent[3] - sourceNumericalShiftY);

    context.scale(sourceResolution / pixelRatio,
      -sourceResolution / pixelRatio);

    context.drawImage(stitchContext.canvas, 0, 0);
    context.restore();
  });

  if (opt_renderEdges) {
    context.save();

    context.strokeStyle = 'black';
    context.lineWidth = 1;

    triangulation.getTriangles().forEach(function(triangle, i, arr) {
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
