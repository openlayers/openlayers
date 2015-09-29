goog.provide('ol.reproj');

goog.require('goog.array');
goog.require('goog.labs.userAgent.browser');
goog.require('goog.labs.userAgent.platform');
goog.require('goog.math');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.math');
goog.require('ol.proj');


/**
 * We need to employ more sophisticated solution
 * if the web browser antialiases clipping edges on canvas.
 *
 * Currently only Chrome does not antialias the edges, but this is probably
 * going to be "fixed" in the future: http://crbug.com/424291
 *
 * @type {boolean}
 * @private
 */
ol.reproj.browserAntialiasesClip_ = !goog.labs.userAgent.browser.isChrome() ||
                                    goog.labs.userAgent.platform.isIos();


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
      targetProj.getPointResolution(targetResolution, targetCenter);

  var targetMPU = targetProj.getMetersPerUnit();
  if (targetMPU !== undefined) {
    sourceResolution *= targetMPU;
  }
  var sourceMPU = sourceProj.getMetersPerUnit();
  if (sourceMPU !== undefined) {
    sourceResolution /= sourceMPU;
  }

  // Based on the projection properties, the point resolution at the specified
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
 *                 image: (HTMLCanvasElement|Image)}>} sources Array of sources.
 * @param {boolean=} opt_renderEdges Render reprojection edges.
 * @return {HTMLCanvasElement} Canvas with reprojected data.
 */
ol.reproj.render = function(width, height, pixelRatio,
    sourceResolution, sourceExtent, targetResolution, targetExtent,
    triangulation, sources, opt_renderEdges) {

  var context = ol.dom.createCanvasContext2D(Math.round(pixelRatio * width),
                                             Math.round(pixelRatio * height));

  if (sources.length === 0) {
    return context.canvas;
  }

  context.scale(pixelRatio, pixelRatio);

  var wrapXShiftDistance = !goog.isNull(sourceExtent) ?
      ol.extent.getWidth(sourceExtent) : 0;

  var wrapXType = ol.reproj.WrapXRendering_.NONE;

  if (triangulation.getWrapsXInSource() && wrapXShiftDistance > 0) {
    // If possible, stitch the sources shifted to solve the wrapX issue here.
    // This is not possible if crossing both "dateline" and "prime meridian".
    var triangulationSrcExtent = triangulation.calculateSourceExtent();
    var triangulationSrcWidth = goog.math.modulo(
        ol.extent.getWidth(triangulationSrcExtent), wrapXShiftDistance);

    if (triangulationSrcWidth < wrapXShiftDistance / 2) {
      wrapXType = ol.reproj.WrapXRendering_.STITCH_SHIFT;
    } else {
      wrapXType = ol.reproj.WrapXRendering_.STITCH_EXTENDED;
    }
  }

  var srcDataExtent = ol.extent.createEmpty();
  goog.array.forEach(sources, function(src, i, arr) {
    if (wrapXType == ol.reproj.WrapXRendering_.STITCH_SHIFT) {
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
      srcDataExtent[0] = ol.math.clamp(
          srcDataExtent[0], sourceExtent[0], sourceExtent[2]);
      srcDataExtent[2] = ol.math.clamp(
          srcDataExtent[2], sourceExtent[0], sourceExtent[2]);
    }
    srcDataExtent[1] = ol.math.clamp(
        srcDataExtent[1], sourceExtent[1], sourceExtent[3]);
    srcDataExtent[3] = ol.math.clamp(
        srcDataExtent[3], sourceExtent[1], sourceExtent[3]);
  }

  var srcDataWidth = ol.extent.getWidth(srcDataExtent);
  var srcDataHeight = ol.extent.getHeight(srcDataExtent);
  var canvasWidthInUnits;
  if (wrapXType == ol.reproj.WrapXRendering_.STITCH_EXTENDED) {
    canvasWidthInUnits = 2 * wrapXShiftDistance;
  } else {
    canvasWidthInUnits = srcDataWidth;
  }

  var stitchContext = ol.dom.createCanvasContext2D(
      Math.round(pixelRatio * canvasWidthInUnits / sourceResolution),
      Math.round(pixelRatio * srcDataHeight / sourceResolution));

  stitchContext.scale(pixelRatio / sourceResolution,
                      pixelRatio / sourceResolution);
  stitchContext.translate(-srcDataExtent[0], srcDataExtent[3]);

  goog.array.forEach(sources, function(src, i, arr) {
    var xPos = src.extent[0];
    var yPos = -src.extent[3];
    var srcWidth = ol.extent.getWidth(src.extent);
    var srcHeight = ol.extent.getHeight(src.extent);

    if (wrapXType == ol.reproj.WrapXRendering_.STITCH_SHIFT) {
      xPos = goog.math.modulo(xPos, wrapXShiftDistance);
    }
    stitchContext.drawImage(src.image, xPos, yPos, srcWidth, srcHeight);

    if (wrapXType == ol.reproj.WrapXRendering_.STITCH_EXTENDED) {
      stitchContext.drawImage(src.image, wrapXShiftDistance + xPos, yPos,
                              srcWidth, srcHeight);
    }
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
    var src = tri.source, tgt = tri.target;
    var x0 = src[0][0], y0 = src[0][1],
        x1 = src[1][0], y1 = src[1][1],
        x2 = src[2][0], y2 = src[2][1];
    var u0 = (tgt[0][0] - targetTL[0]) / targetResolution,
        v0 = -(tgt[0][1] - targetTL[1]) / targetResolution;
    var u1 = (tgt[1][0] - targetTL[0]) / targetResolution,
        v1 = -(tgt[1][1] - targetTL[1]) / targetResolution;
    var u2 = (tgt[2][0] - targetTL[0]) / targetResolution,
        v2 = -(tgt[2][1] - targetTL[1]) / targetResolution;

    var performWrapXShift = wrapXType == ol.reproj.WrapXRendering_.STITCH_SHIFT;
    if (wrapXType == ol.reproj.WrapXRendering_.STITCH_EXTENDED) {
      var minX = Math.min(x0, x1, x2);
      var maxX = Math.max(x0, x1, x2);

      performWrapXShift = minX <= sourceExtent[0] ||
                          (maxX - minX) > wrapXShiftDistance / 2;
    }

    if (performWrapXShift) {
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
      [x1, y1, 0, 0, u1 - u0],
      [x2, y2, 0, 0, u2 - u0],
      [0, 0, x1, y1, v1 - v0],
      [0, 0, x2, y2, v2 - v0]
    ];
    var coefs = ol.math.solveLinearSystem(augmentedMatrix);
    if (goog.isNull(coefs)) {
      return;
    }

    context.beginPath();
    if (ol.reproj.browserAntialiasesClip_) {
      var centroidX = (u0 + u1 + u2) / 3, centroidY = (v0 + v1 + v2) / 3;
      var p0 = ol.reproj.enlargeClipPoint_(centroidX, centroidY, u0, v0);
      var p1 = ol.reproj.enlargeClipPoint_(centroidX, centroidY, u1, v1);
      var p2 = ol.reproj.enlargeClipPoint_(centroidX, centroidY, u2, v2);

      context.moveTo(p0[0], p0[1]);
      context.lineTo(p1[0], p1[1]);
      context.lineTo(p2[0], p2[1]);
    } else {
      context.moveTo(u0, v0);
      context.lineTo(u1, v1);
      context.lineTo(u2, v2);
    }
    context.closePath();
    context.clip();

    context.transform(coefs[0], coefs[2], coefs[1], coefs[3], u0, v0);

    context.translate(srcDataExtent[0] - srcNumericalShiftX,
                      srcDataExtent[3] - srcNumericalShiftY);

    context.scale(sourceResolution / pixelRatio,
                  -sourceResolution / pixelRatio);

    context.drawImage(stitchContext.canvas, 0, 0);
    context.restore();
  });

  if (opt_renderEdges) {
    context.save();

    context.strokeStyle = 'black';
    context.lineWidth = 1;

    goog.array.forEach(triangulation.getTriangles(), function(tri, i, arr) {

      var tgt = tri.target;
      var u0 = (tgt[0][0] - targetTL[0]) / targetResolution,
          v0 = -(tgt[0][1] - targetTL[1]) / targetResolution;
      var u1 = (tgt[1][0] - targetTL[0]) / targetResolution,
          v1 = -(tgt[1][1] - targetTL[1]) / targetResolution;
      var u2 = (tgt[2][0] - targetTL[0]) / targetResolution,
          v2 = -(tgt[2][1] - targetTL[1]) / targetResolution;

      context.beginPath();
      context.moveTo(u0, v0);
      context.lineTo(u1, v1);
      context.lineTo(u2, v2);
      context.closePath();
      context.stroke();
    });

    context.restore();
  }
  return context.canvas;
};


/**
 * Type of solution used to solve wrapX in source during rendering.
 * @enum {number}
 * @private
 */
ol.reproj.WrapXRendering_ = {
  NONE: 0,
  STITCH_SHIFT: 1,
  STITCH_EXTENDED: 2
};
