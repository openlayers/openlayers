goog.provide('ol.reproj.Triangulation');
goog.provide('ol.reproj.triangulation');

goog.require('goog.array');
goog.require('goog.math');
goog.require('ol.extent');


/**
 * Array of triangles,
 *   each triangles is Array (length=3) of
 *   projected point pairs (length=2; [src, dst]),
 *   each point is ol.Coordinate.
 * @typedef {Array.<Array.<Array.<ol.Coordinate>>>}
 */
ol.reproj.Triangulation;


/**
 * Adds triangle to the triangulation (and reprojects the vertices) if valid.
 * @private
 * @param {ol.reproj.Triangulation} triangulation
 * @param {ol.Coordinate} a
 * @param {ol.Coordinate} b
 * @param {ol.Coordinate} c
 * @param {ol.TransformFunction} transformInv Inverse transform (dst -> src).
 * @param {ol.Extent=} opt_maxTargetExtent
 * @param {ol.Extent=} opt_maxSourceExtent
 */
ol.reproj.triangulation.addTriangleIfValid_ = function(triangulation, a, b, c,
    transformInv, opt_maxTargetExtent, opt_maxSourceExtent) {
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
  var aSrc = transformInv(a);
  var bSrc = transformInv(b);
  var cSrc = transformInv(c);
  if (goog.isDefAndNotNull(opt_maxSourceExtent)) {
    var srcTriangleExtent = ol.extent.boundingExtent([aSrc, bSrc, cSrc]);
    if (!ol.extent.intersects(srcTriangleExtent, opt_maxSourceExtent)) {
      // whole triangle outside source projection extent -> ignore
      return;
    }
  }
  triangulation.push([[aSrc, a], [bSrc, b], [cSrc, c]]);
};


/**
 * Triangulates given extent and reprojects vertices.
 * TODO: improved triangulation, better error handling of some trans fails
 * @param {ol.Extent} extent
 * @param {ol.TransformFunction} transformInv Inverse transform (dst -> src).
 * @param {ol.Extent=} opt_maxTargetExtent
 * @param {ol.Extent=} opt_maxSourceExtent
 * @param {number=} opt_subdiv Subdivision factor (default 4).
 * @return {ol.reproj.Triangulation}
 */
ol.reproj.triangulation.createForExtent = function(extent, transformInv,
                                                   opt_maxTargetExtent,
                                                   opt_maxSourceExtent,
                                                   opt_subdiv) {

  var triangulation = [];

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
          transformInv, opt_maxTargetExtent, opt_maxSourceExtent);
      ol.reproj.triangulation.addTriangleIfValid_(
          triangulation, x0y0dst, x1y0dst, x1y1dst,
          transformInv, opt_maxTargetExtent, opt_maxSourceExtent);
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

  goog.array.forEach(triangulation, function(triangle, i, arr) {
    ol.extent.extendCoordinate(extent, triangle[0][0]);
    ol.extent.extendCoordinate(extent, triangle[1][0]);
    ol.extent.extendCoordinate(extent, triangle[2][0]);
  });

  return extent;
};
