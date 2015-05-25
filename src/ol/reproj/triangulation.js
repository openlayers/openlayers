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
 * Triangulates given extent and reprojects vertices.
 * TODO: improved triangulation, better error handling of some trans fails
 * @param {ol.Extent} extent
 * @param {ol.TransformFunction} transformInv Inverse transform (dst -> src).
 * @param {number=} opt_subdiv Subdivision factor (default 4).
 * @return {ol.reproj.Triangulation}
 */
ol.reproj.triangulation.createForExtent = function(extent, transformInv,
                                                   opt_subdiv) {
  var triangulation = [];

  var tlDst = ol.extent.getTopLeft(extent);
  var brDst = ol.extent.getBottomRight(extent);

  var projected = {0: {}}; // cache of already transformed values
  var subdiv = opt_subdiv || 4;
  for (var y = 0; y < subdiv; y++) {
    projected[y + 1] = {}; // prepare cache for the next line
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

      if (!goog.isDef(projected[y][x])) {
        projected[y][x] = transformInv(x0y0dst);
      }
      if (!goog.isDef(projected[y][x + 1])) {
        projected[y][x + 1] = transformInv(x1y0dst);
      }
      if (!goog.isDef(projected[y + 1][x])) {
        projected[y + 1][x] = transformInv(x0y1dst);
      }
      if (!goog.isDef(projected[y + 1][x + 1])) {
        projected[y + 1][x + 1] = transformInv(x1y1dst);
      }

      triangulation.push(
          [
            [projected[y][x], x0y0dst],
            [projected[y + 1][x + 1], x1y1dst],
            [projected[y + 1][x], x0y1dst]
          ], [
            [projected[y][x], x0y0dst],
            [projected[y][x + 1], x1y0dst],
            [projected[y + 1][x + 1], x1y1dst]
          ]
      );
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
