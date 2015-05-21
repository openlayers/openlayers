goog.provide('ol.geom.flat.interiorpoint');

goog.require('goog.asserts');
goog.require('ol.geom.flat.contains');


/**
 * Calculates a point that is likely to lie in the interior of the linear rings.
 * Inspired by JTS's com.vividsolutions.jts.geom.Geometry#getInteriorPoint.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {Array.<number>} flatCenters Flat centers.
 * @param {number} flatCentersOffset Flat center offset.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Destination.
 */
ol.geom.flat.interiorpoint.linearRings = function(flatCoordinates, offset,
    ends, stride, flatCenters, flatCentersOffset, opt_dest) {
  var i, ii, x, x1, x2, y1, y2;
  var y = flatCenters[flatCentersOffset + 1];
  /** @type {Array.<number>} */
  var intersections = [];
  // Calculate intersections with the horizontal line
  var end = ends[0];
  x1 = flatCoordinates[end - stride];
  y1 = flatCoordinates[end - stride + 1];
  for (i = offset; i < end; i += stride) {
    x2 = flatCoordinates[i];
    y2 = flatCoordinates[i + 1];
    if ((y <= y1 && y2 <= y) || (y1 <= y && y <= y2)) {
      x = (y - y1) / (y2 - y1) * (x2 - x1) + x1;
      intersections.push(x);
    }
    x1 = x2;
    y1 = y2;
  }
  // Find the longest segment of the horizontal line that has its center point
  // inside the linear ring.
  var pointX = NaN;
  var maxSegmentLength = -Infinity;
  intersections.sort();
  x1 = intersections[0];
  for (i = 1, ii = intersections.length; i < ii; ++i) {
    x2 = intersections[i];
    var segmentLength = Math.abs(x2 - x1);
    if (segmentLength > maxSegmentLength) {
      x = (x1 + x2) / 2;
      if (ol.geom.flat.contains.linearRingsContainsXY(
          flatCoordinates, offset, ends, stride, x, y)) {
        pointX = x;
        maxSegmentLength = segmentLength;
      }
    }
    x1 = x2;
  }
  if (isNaN(pointX)) {
    // There is no horizontal line that has its center point inside the linear
    // ring.  Use the center of the the linear ring's extent.
    pointX = flatCenters[flatCentersOffset];
  }
  if (goog.isDef(opt_dest)) {
    opt_dest.push(pointX, y);
    return opt_dest;
  } else {
    return [pointX, y];
  }
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {Array.<number>} flatCenters Flat centers.
 * @return {Array.<number>} Interior points.
 */
ol.geom.flat.interiorpoint.linearRingss =
    function(flatCoordinates, offset, endss, stride, flatCenters) {
  goog.asserts.assert(2 * endss.length == flatCenters.length);
  var interiorPoints = [];
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    interiorPoints = ol.geom.flat.interiorpoint.linearRings(flatCoordinates,
        offset, ends, stride, flatCenters, 2 * i, interiorPoints);
    offset = ends[ends.length - 1];
  }
  return interiorPoints;
};
