goog.provide('ol.reproj.Triangulation');
goog.provide('ol.reproj.triangulation');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.coordinate');
goog.require('ol.extent');
goog.require('ol.proj');


/**
 * Single triangle; consists of 3 source points and 3 target points.
 *   `needsShift` can be used to indicate that the whole triangle has to be
 *   shifted during reprojection. This is needed for triangles crossing edges
 *   of the source projection (dateline).
 *
 * @typedef {{source: Array.<ol.Coordinate>,
 *            target: Array.<ol.Coordinate>,
 *            needsShift: boolean}}
 */
ol.reproj.Triangle;


/**
 * @typedef {{triangles: Array.<ol.reproj.Triangle>,
 *            shiftDistance: number}}
 */
ol.reproj.Triangulation;


/**
 * Adds triangle to the triangulation (and reprojects the vertices) if valid.
 * @private
 * @param {ol.reproj.Triangulation} triangulation
 * @param {ol.Coordinate} a
 * @param {ol.Coordinate} b
 * @param {ol.Coordinate} c
 * @param {ol.proj.Projection} sourceProj
 * @param {ol.proj.Projection} targetProj
 * @param {ol.Extent=} opt_maxTargetExtent
 * @param {ol.Extent=} opt_maxSourceExtent
 */
ol.reproj.triangulation.addTriangleIfValid_ = function(triangulation, a, b, c,
    sourceProj, targetProj, opt_maxTargetExtent, opt_maxSourceExtent) {
  if (goog.isDefAndNotNull(opt_maxTargetExtent)) {
    if (!ol.extent.containsCoordinate(opt_maxTargetExtent, a) &&
        !ol.extent.containsCoordinate(opt_maxTargetExtent, b) &&
        !ol.extent.containsCoordinate(opt_maxTargetExtent, c)) {
      // whole triangle outside target projection extent -> ignore
      return;
    }
    // clamp the vertices to the extent edges before transforming
    a = ol.extent.closestCoordinate(opt_maxTargetExtent, a);
    b = ol.extent.closestCoordinate(opt_maxTargetExtent, b);
    c = ol.extent.closestCoordinate(opt_maxTargetExtent, c);
  }
  var transformInv = ol.proj.getTransform(targetProj, sourceProj);
  var aSrc = transformInv(a);
  var bSrc = transformInv(b);
  var cSrc = transformInv(c);
  if (goog.isDefAndNotNull(opt_maxSourceExtent)) {
    var srcTriangleExtent = ol.extent.boundingExtent([aSrc, bSrc, cSrc]);
    if (!ol.extent.intersects(srcTriangleExtent, opt_maxSourceExtent)) {
      // whole triangle outside source projection extent -> ignore
      // TODO: intersect triangle with the extent rather than bbox ?
      return;
    }
    if (!ol.extent.containsCoordinate(opt_maxSourceExtent, aSrc) ||
        !ol.extent.containsCoordinate(opt_maxSourceExtent, bSrc) ||
        !ol.extent.containsCoordinate(opt_maxSourceExtent, cSrc)) {
      // if any vertex is outside projection range, modify the target triangle
      // TODO: do not do closestCoordinate, but rather scale the triangle with
      //       respect to a point inside the extent
      aSrc = ol.extent.closestCoordinate(opt_maxSourceExtent, aSrc);
      bSrc = ol.extent.closestCoordinate(opt_maxSourceExtent, bSrc);
      cSrc = ol.extent.closestCoordinate(opt_maxSourceExtent, cSrc);
      var transformFwd = ol.proj.getTransform(sourceProj, targetProj);
      a = transformFwd(aSrc);
      b = transformFwd(bSrc);
      c = transformFwd(cSrc);
    }
  }
  var needsShift = false;
  if (sourceProj.canWrapX()) {
    // determine if the triangle crosses the dateline here
    // This can be detected by transforming centroid of the target triangle.
    // If the transformed centroid is outside the transformed triangle,
    // the triangle wraps around projection extent.

    var centroid = [(a[0] + b[0] + c[0]) / 3,
                    (a[1] + b[1] + c[1]) / 3];
    var centroidSrc = transformInv(centroid);

    if (!ol.coordinate.isInTriangle(centroidSrc, aSrc, bSrc, cSrc)) {
      needsShift = true;
    }
  }
  triangulation.triangles.push({
    source: [aSrc, bSrc, cSrc],
    target: [a, b, c],
    needsShift: needsShift
  });
  if (needsShift) {
    var sourceProjExtent = sourceProj.getExtent();
    triangulation.shiftDistance = ol.extent.getWidth(sourceProjExtent);
  }
};


/**
 * Triangulates given extent and reprojects vertices.
 * TODO: improved triangulation, better error handling of some trans fails
 * @param {ol.Extent} extent
 * @param {ol.proj.Projection} sourceProj
 * @param {ol.proj.Projection} targetProj
 * @param {ol.Extent=} opt_maxTargetExtent
 * @param {ol.Extent=} opt_maxSourceExtent
 * @param {number=} opt_subdiv Subdivision factor (default 4).
 * @return {ol.reproj.Triangulation}
 */
ol.reproj.triangulation.createForExtent = function(extent, sourceProj,
    targetProj, opt_maxTargetExtent, opt_maxSourceExtent, opt_subdiv) {

  var triangulation = {
    triangles: [],
    shiftDistance: 0
  };

  var tlDst = ol.extent.getTopLeft(extent);
  var brDst = ol.extent.getBottomRight(extent);

  var subdiv = opt_subdiv || 4;
  for (var y = 0; y < subdiv; y++) {
    for (var x = 0; x < subdiv; x++) {
      // do 2 triangle: [(x, y), (x + 1, y + 1), (x, y + 1)]
      //                [(x, y), (x + 1, y), (x + 1, y + 1)]

      var x0y0dst = [
        goog.math.lerp(tlDst[0], brDst[0], x / subdiv),
        goog.math.lerp(tlDst[1], brDst[1], y / subdiv)
      ];
      var x1y0dst = [
        goog.math.lerp(tlDst[0], brDst[0], (x + 1) / subdiv),
        goog.math.lerp(tlDst[1], brDst[1], y / subdiv)
      ];
      var x0y1dst = [
        goog.math.lerp(tlDst[0], brDst[0], x / subdiv),
        goog.math.lerp(tlDst[1], brDst[1], (y + 1) / subdiv)
      ];
      var x1y1dst = [
        goog.math.lerp(tlDst[0], brDst[0], (x + 1) / subdiv),
        goog.math.lerp(tlDst[1], brDst[1], (y + 1) / subdiv)
      ];

      ol.reproj.triangulation.addTriangleIfValid_(
          triangulation, x0y0dst, x1y1dst, x0y1dst,
          sourceProj, targetProj, opt_maxTargetExtent, opt_maxSourceExtent);
      ol.reproj.triangulation.addTriangleIfValid_(
          triangulation, x0y0dst, x1y0dst, x1y1dst,
          sourceProj, targetProj, opt_maxTargetExtent, opt_maxSourceExtent);
    }
  }

  return triangulation;
};


/**
 * @param {ol.reproj.Triangulation} triangulation
 * @return {ol.Extent}
 */
ol.reproj.triangulation.getSourceExtent = function(triangulation) {
  var extent = ol.extent.createEmpty();

  var distance = triangulation.shiftDistance;
  if (distance > 0) {
    goog.array.forEach(triangulation.triangles, function(triangle, i, arr) {
      var src = triangle.source;
      ol.extent.extendCoordinate(extent,
          [goog.math.modulo(src[0][0] + distance, distance), src[0][1]]);
      ol.extent.extendCoordinate(extent,
          [goog.math.modulo(src[1][0] + distance, distance), src[1][1]]);
      ol.extent.extendCoordinate(extent,
          [goog.math.modulo(src[2][0] + distance, distance), src[2][1]]);
    });
    if (extent[0] > distance / 2) extent[0] -= distance;
    if (extent[2] > distance / 2) extent[2] -= distance;
  } else {
    goog.array.forEach(triangulation.triangles, function(triangle, i, arr) {
      var src = triangle.source;
      ol.extent.extendCoordinate(extent, src[0]);
      ol.extent.extendCoordinate(extent, src[1]);
      ol.extent.extendCoordinate(extent, src[2]);
    });
  }

  return extent;
};
