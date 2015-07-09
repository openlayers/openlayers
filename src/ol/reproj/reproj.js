goog.provide('ol.reproj');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.math');
goog.require('ol.proj');


/**
 * Calculates ideal resolution to use from the source in order to achieve
 * pixel mapping as close as possible to 1:1 during reprojection.
 * The resolution is calculated regardless on what resolutions
 * are actually available in the dataset (TileGrid, Image, ...).
 *
 * @param {ol.proj.Projection} sourceProj
 * @param {ol.proj.Projection} targetProj
 * @param {ol.Coordinate} targetCenter
 * @param {number} targetResolution
 * @return {number} The best resolution to use. Can be +-Infinity, NaN or 0.
 */
ol.reproj.calculateSourceResolution = function(sourceProj, targetProj,
    targetCenter, targetResolution) {

  var sourceCenter = ol.proj.transform(targetCenter, targetProj, sourceProj);

  // calculate the ideal resolution of the source data
  var sourceResolution =
      targetProj.getPointResolution(targetResolution, targetCenter) *
      targetProj.getMetersPerUnit() / sourceProj.getMetersPerUnit();

  // based on the projection properties, the point resolution at the specified
  // coordinates may be slightly different. We need to reverse-compensate this
  // in order to achieve optimal results.

  var compensationFactor =
      sourceProj.getPointResolution(sourceResolution, sourceCenter) /
      sourceResolution;

  if (goog.math.isFiniteNumber(compensationFactor) && compensationFactor > 0) {
    sourceResolution /= compensationFactor;
  }

  return sourceResolution;
};


/**
 * Renders the source into the canvas based on the triangulation.
 * @param {CanvasRenderingContext2D} context
 * @param {number} sourceResolution
 * @param {ol.Extent} sourceExtent
 * @param {number} targetResolution
 * @param {ol.Extent} targetExtent
 * @param {ol.reproj.Triangulation} triangulation
 * @param {Array.<{extent: ol.Extent,
 *                 image: (HTMLCanvasElement|Image)}>} sources
 */
ol.reproj.renderTriangles = function(context,
    sourceResolution, sourceExtent, targetResolution, targetExtent,
    triangulation, sources) {

  var wrapXShiftDistance = !goog.isNull(sourceExtent) ?
      ol.extent.getWidth(sourceExtent) : 0;

  var wrapXShiftNeeded = triangulation.getWrapsXInSource() &&
      (wrapXShiftDistance > 0);

  // If possible, stitch the sources shifted to solve the wrapX issue here.
  // This is not possible if crossing both "dateline" and "prime meridian".
  var performGlobalWrapXShift = false;
  if (wrapXShiftNeeded) {
    var triangulationSrcExtent = triangulation.calculateSourceExtent();
    var triangulationSrcWidth = goog.math.modulo(
        ol.extent.getWidth(triangulationSrcExtent), wrapXShiftDistance);
    performGlobalWrapXShift = triangulationSrcWidth < wrapXShiftDistance / 2;
  }

  var srcDataExtent = ol.extent.createEmpty();
  goog.array.forEach(sources, function(src, i, arr) {
    if (performGlobalWrapXShift) {
      var srcW = src.extent[2] - src.extent[0];
      var srcX = goog.math.modulo(src.extent[0], wrapXShiftDistance);
      ol.extent.extend(srcDataExtent, [srcX, src.extent[1],
                                       srcX + srcW, src.extent[3]]);
    } else {
      ol.extent.extend(srcDataExtent, src.extent);
    }
  });
  if (!goog.isNull(sourceExtent)) {
    if (wrapXType == ol.reproj.WrapXRendering_.NONE) {
      srcDataExtent[0] = goog.math.clamp(
          srcDataExtent[0], sourceExtent[0], sourceExtent[2]);
      srcDataExtent[2] = goog.math.clamp(
          srcDataExtent[2], sourceExtent[0], sourceExtent[2]);
    }
    srcDataExtent[1] = goog.math.clamp(
        srcDataExtent[1], sourceExtent[1], sourceExtent[3]);
    srcDataExtent[3] = goog.math.clamp(
        srcDataExtent[3], sourceExtent[1], sourceExtent[3]);
  }

  var srcDataWidth = ol.extent.getWidth(srcDataExtent);
  var srcDataHeight = ol.extent.getHeight(srcDataExtent);
  var stitchContext = ol.dom.createCanvasContext2D(
      Math.ceil(srcDataWidth / sourceResolution),
      Math.ceil(srcDataHeight / sourceResolution));

  stitchContext.scale(1 / sourceResolution, 1 / sourceResolution);
  stitchContext.translate(-srcDataExtent[0], srcDataExtent[3]);

  goog.array.forEach(sources, function(src, i, arr) {
    var xPos = performGlobalWrapXShift ?
        goog.math.modulo(src.extent[0], wrapXShiftDistance) : src.extent[0];
    stitchContext.drawImage(src.image, xPos, -src.extent[3],
        src.extent[2] - src.extent[0], src.extent[3] - src.extent[1]);
  });

  var targetTL = ol.extent.getTopLeft(targetExtent);

  goog.array.forEach(triangulation.getTriangles(), function(tri, i, arr) {
    context.save();

    /* Calculate affine transform (src -> dst)
     * Resulting matrix can be used to transform coordinate
     * from `sourceProjection` to destination pixels.
     *
     * To optimize number of context calls and increase numerical stability,
     * we also do the following operations:
     * trans(-topLeftExtentCorner), scale(1 / targetResolution), scale(1, -1)
     * here before solving the linear system.
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
    var src = tri.source, tgt = tri.target;
    var x0 = src[0][0], y0 = src[0][1],
        x1 = src[1][0], y1 = src[1][1],
        x2 = src[2][0], y2 = src[2][1];
    var u0 = tgt[0][0] - targetTL[0], v0 = -(tgt[0][1] - targetTL[1]),
        u1 = tgt[1][0] - targetTL[0], v1 = -(tgt[1][1] - targetTL[1]),
        u2 = tgt[2][0] - targetTL[0], v2 = -(tgt[2][1] - targetTL[1]);

    var performIndividualWrapXShift = !performGlobalWrapXShift &&
        (wrapXShiftNeeded &&
        (Math.max(x0, x1, x2) - Math.min(x0, x1, x2)) > wrapXShiftDistance / 2);

    if (performGlobalWrapXShift || performIndividualWrapXShift) {
      x0 = goog.math.modulo(x0, wrapXShiftDistance);
      x1 = goog.math.modulo(x1, wrapXShiftDistance);
      x2 = goog.math.modulo(x2, wrapXShiftDistance);
    }

    // Shift all the source points to improve numerical stability
    // of all the subsequent calculations. The [x0, y0] is used here.
    // This is also used to simplify the linear system.
    var srcNumericalShiftX = x0, srcNumericalShiftY = y0;
    x0 = 0;
    y0 = 0;
    x1 -= srcNumericalShiftX;
    y1 -= srcNumericalShiftY;
    x2 -= srcNumericalShiftX;
    y2 -= srcNumericalShiftY;

    var augmentedMatrix = [
      [x1, y1, 0, 0, (u1 - u0) / targetResolution],
      [x2, y2, 0, 0, (u2 - u0) / targetResolution],
      [0, 0, x1, y1, (v1 - v0) / targetResolution],
      [0, 0, x2, y2, (v2 - v0) / targetResolution]
    ];
    var coefs = ol.math.solveLinearSystem(augmentedMatrix);
    if (goog.isNull(coefs)) {
      return;
    }

    context.setTransform(coefs[0], coefs[2], coefs[1], coefs[3],
                         u0 / targetResolution, v0 / targetResolution);

    var pixelSize = sourceResolution;
    var centroid = [(x0 + x1 + x2) / 3, (y0 + y1 + y2) / 3];

    // moves the `point` farther away from the `anchor`
    var increasePointDistance = function(point, anchor, increment) {
      var dir = [point[0] - anchor[0], point[1] - anchor[1]];
      var distance = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1]);
      var scaleFactor = (distance + increment) / distance;
      return [anchor[0] + scaleFactor * dir[0],
              anchor[1] + scaleFactor * dir[1]];
    };

    // enlarge the triangle so that the clip paths of individual triangles
    //   slightly (1px) overlap to prevent transparency errors on triangle edges
    var p0 = increasePointDistance([x0, y0], centroid, pixelSize);
    var p1 = increasePointDistance([x1, y1], centroid, pixelSize);
    var p2 = increasePointDistance([x2, y2], centroid, pixelSize);

    context.beginPath();
    context.moveTo(p0[0], p0[1]);
    context.lineTo(p1[0], p1[1]);
    context.lineTo(p2[0], p2[1]);
    context.closePath();
    context.clip();

    context.save();
    context.translate(srcDataExtent[0] - srcNumericalShiftX,
                      srcDataExtent[3] - srcNumericalShiftY);

    context.scale(sourceResolution, -sourceResolution);

    context.drawImage(stitchContext.canvas, 0, 0);

    if (performIndividualWrapXShift) {
      // It was not possible to solve the wrapX shifting during stitching ->
      //   render the data second time (shifted) to solve the wrapX.
      context.translate(wrapXShiftDistance / sourceResolution, 0);
      context.drawImage(stitchContext.canvas, 0, 0);
    }

    context.restore();

    if (goog.DEBUG) {
      context.strokeStyle = 'black';
      context.lineWidth = 2 * pixelSize;
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.lineTo(x2, y2);
      context.closePath();
      context.stroke();
    }

    context.restore();
  });
};
