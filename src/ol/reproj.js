goog.provide('ol.reproj');

goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.math');
goog.require('ol.proj');


/**
 * Calculates ideal resolution to use from the source in order to achieve
 * pixel mapping as close as possible to 1:1 during reprojection.
 * The resolution is calculated regardless of what resolutions
 * are actually available in the dataset (TileGrid, Image, ...).
 *
 * @param {ol.proj.Projection} sourceProj Source projection.
 * @param {ol.proj.Projection} targetProj Target projection.
 * @param {ol.Coordinate} targetCenter Target center.
 * @param {number} targetResolution Target resolution.
 * @return {number} The best resolution to use. Can be +-Infinity, NaN or 0.
 */
ol.reproj.calculateSourceResolution = function(sourceProj, targetProj,
    targetCenter, targetResolution) {

  var sourceCenter = ol.proj.transform(targetCenter, targetProj, sourceProj);

  // calculate the ideal resolution of the source data
  var sourceResolution =
      ol.proj.getPointResolution(targetProj, targetResolution, targetCenter);

  var targetMetersPerUnit = targetProj.getMetersPerUnit();
  if (targetMetersPerUnit !== undefined) {
    sourceResolution *= targetMetersPerUnit;
  }
  var sourceMetersPerUnit = sourceProj.getMetersPerUnit();
  if (sourceMetersPerUnit !== undefined) {
    sourceResolution /= sourceMetersPerUnit;
  }

  // Based on the projection properties, the point resolution at the specified
  // coordinates may be slightly different. We need to reverse-compensate this
  // in order to achieve optimal results.

  var sourceExtent = sourceProj.getExtent();
  if (!sourceExtent || ol.extent.containsCoordinate(sourceExtent, sourceCenter)) {
    var compensationFactor =
        ol.proj.getPointResolution(sourceProj, sourceResolution, sourceCenter) /
        sourceResolution;
    if (isFinite(compensationFactor) && compensationFactor > 0) {
      sourceResolution /= compensationFactor;
    }
  }

  return sourceResolution;
};


/**
 * Enlarge the clipping triangle point by 1 pixel to ensure the edges overlap
 * in order to mask gaps caused by antialiasing.
 *
 * @param {number} centroidX Centroid of the triangle (x coordinate in pixels).
 * @param {number} centroidY Centroid of the triangle (y coordinate in pixels).
 * @param {number} x X coordinate of the point (in pixels).
 * @param {number} y Y coordinate of the point (in pixels).
 * @return {ol.Coordinate} New point 1 px farther from the centroid.
 * @private
 */
ol.reproj.enlargeClipPoint_ = function(centroidX, centroidY, x, y) {
  var dX = x - centroidX, dY = y - centroidY;
  var distance = Math.sqrt(dX * dX + dY * dY);
  return [Math.round(x + dX / distance), Math.round(y + dY / distance)];
};


/**
 * Renders the source data into new canvas based on the triangulation.
 *
 * @param {number} width Width of the canvas.
 * @param {number} height Height of the canvas.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} sourceResolution Source resolution.
 * @param {ol.Extent} sourceExtent Extent of the data source.
 * @param {number} targetResolution Target resolution.
 * @param {ol.Extent} targetExtent Target extent.
 * @param {ol.reproj.Triangulation} triangulation Calculated triangulation.
 * @param {Array.<{extent: ol.Extent,
 *                 image: (HTMLCanvasElement|Image|HTMLVideoElement)}>} sources
 *             Array of sources.
 * @param {number} gutter Gutter of the sources.
 * @param {boolean=} opt_renderEdges Render reprojection edges.
 * @return {HTMLCanvasElement} Canvas with reprojected data.
 */
ol.reproj.render = function(width, height, pixelRatio,
    sourceResolution, sourceExtent, targetResolution, targetExtent,
    triangulation, sources, gutter, opt_renderEdges) {

  var context = ol.dom.createCanvasContext2D(Math.round(pixelRatio * width),
      Math.round(pixelRatio * height));

  if (sources.length === 0) {
    return context.canvas;
  }

  context.scale(pixelRatio, pixelRatio);

  var sourceDataExtent = ol.extent.createEmpty();
  sources.forEach(function(src, i, arr) {
    ol.extent.extend(sourceDataExtent, src.extent);
  });

  var canvasWidthInUnits = ol.extent.getWidth(sourceDataExtent);
  var canvasHeightInUnits = ol.extent.getHeight(sourceDataExtent);
  var stitchContext = ol.dom.createCanvasContext2D(
      Math.round(pixelRatio * canvasWidthInUnits / sourceResolution),
      Math.round(pixelRatio * canvasHeightInUnits / sourceResolution));

  var stitchScale = pixelRatio / sourceResolution;

  sources.forEach(function(src, i, arr) {
    var xPos = src.extent[0] - sourceDataExtent[0];
    var yPos = -(src.extent[3] - sourceDataExtent[3]);
    var srcWidth = ol.extent.getWidth(src.extent);
    var srcHeight = ol.extent.getHeight(src.extent);

    stitchContext.drawImage(
        src.image,
        gutter, gutter,
        src.image.width - 2 * gutter, src.image.height - 2 * gutter,
        xPos * stitchScale, yPos * stitchScale,
        srcWidth * stitchScale, srcHeight * stitchScale);
  });

  var targetTopLeft = ol.extent.getTopLeft(targetExtent);

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
    var source = triangle.source, target = triangle.target;
    var x0 = source[0][0], y0 = source[0][1],
        x1 = source[1][0], y1 = source[1][1],
        x2 = source[2][0], y2 = source[2][1];
    var u0 = (target[0][0] - targetTopLeft[0]) / targetResolution,
        v0 = -(target[0][1] - targetTopLeft[1]) / targetResolution;
    var u1 = (target[1][0] - targetTopLeft[0]) / targetResolution,
        v1 = -(target[1][1] - targetTopLeft[1]) / targetResolution;
    var u2 = (target[2][0] - targetTopLeft[0]) / targetResolution,
        v2 = -(target[2][1] - targetTopLeft[1]) / targetResolution;

    // Shift all the source points to improve numerical stability
    // of all the subsequent calculations. The [x0, y0] is used here.
    // This is also used to simplify the linear system.
    var sourceNumericalShiftX = x0, sourceNumericalShiftY = y0;
    x0 = 0;
    y0 = 0;
    x1 -= sourceNumericalShiftX;
    y1 -= sourceNumericalShiftY;
    x2 -= sourceNumericalShiftX;
    y2 -= sourceNumericalShiftY;

    var augmentedMatrix = [
      [x1, y1, 0, 0, u1 - u0],
      [x2, y2, 0, 0, u2 - u0],
      [0, 0, x1, y1, v1 - v0],
      [0, 0, x2, y2, v2 - v0]
    ];
    var affineCoefs = ol.math.solveLinearSystem(augmentedMatrix);
    if (!affineCoefs) {
      return;
    }

    context.save();
    context.beginPath();
    var centroidX = (u0 + u1 + u2) / 3, centroidY = (v0 + v1 + v2) / 3;
    var p0 = ol.reproj.enlargeClipPoint_(centroidX, centroidY, u0, v0);
    var p1 = ol.reproj.enlargeClipPoint_(centroidX, centroidY, u1, v1);
    var p2 = ol.reproj.enlargeClipPoint_(centroidX, centroidY, u2, v2);

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
      var target = triangle.target;
      var u0 = (target[0][0] - targetTopLeft[0]) / targetResolution,
          v0 = -(target[0][1] - targetTopLeft[1]) / targetResolution;
      var u1 = (target[1][0] - targetTopLeft[0]) / targetResolution,
          v1 = -(target[1][1] - targetTopLeft[1]) / targetResolution;
      var u2 = (target[2][0] - targetTopLeft[0]) / targetResolution,
          v2 = -(target[2][1] - targetTopLeft[1]) / targetResolution;

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
};
