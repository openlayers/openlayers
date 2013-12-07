// FIXME find better names for these functions

goog.provide('ol.geom.closest');

goog.require('goog.asserts');
goog.require('ol.geom.flat');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} maxSquaredDelta Max squared delta.
 * @return {number} Max squared delta.
 */
ol.geom.closest.getMaxSquaredDelta =
    function(flatCoordinates, offset, end, stride, maxSquaredDelta) {
  var x1 = flatCoordinates[offset];
  var y1 = flatCoordinates[offset + 1];
  for (offset += stride; offset < end; offset += stride) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    var squaredDelta = ol.geom.flat.squaredDistance(x1, y1, x2, y2);
    if (squaredDelta > maxSquaredDelta) {
      maxSquaredDelta = squaredDelta;
    }
    x1 = x2;
    y1 = y2;
  }
  return maxSquaredDelta;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} maxSquaredDelta Max squared delta.
 * @return {number} Max squared delta.
 */
ol.geom.closest.getsMaxSquaredDelta =
    function(flatCoordinates, offset, ends, stride, maxSquaredDelta) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    maxSquaredDelta = ol.geom.closest.getMaxSquaredDelta(
        flatCoordinates, offset, end, stride, maxSquaredDelta);
    offset = end;
  }
  return maxSquaredDelta;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} maxSquaredDelta Max squared delta.
 * @return {number} Max squared delta.
 */
ol.geom.closest.getssMaxSquaredDelta =
    function(flatCoordinates, offset, endss, stride, maxSquaredDelta) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    maxSquaredDelta = ol.geom.closest.getsMaxSquaredDelta(
        flatCoordinates, offset, ends, stride, maxSquaredDelta);
    offset = ends[ends.length - 1];
  }
  return maxSquaredDelta;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} maxDelta Max delta.
 * @param {boolean} isRing Is ring.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Array.<number>} closestPoint Closest point.
 * @param {number} minSquaredDistance Minimum squared distance.
 * @return {number} Minimum squared distance.
 */
ol.geom.closest.getClosestPoint = function(flatCoordinates, offset, end, stride,
    maxDelta, isRing, x, y, closestPoint, minSquaredDistance) {
  if (offset == end) {
    return minSquaredDistance;
  }
  var squaredDistance;
  if (maxDelta === 0) {
    // All points are identical, so just test the first point.
    squaredDistance = ol.geom.flat.squaredDistance(
        x, y, flatCoordinates[offset], flatCoordinates[offset + 1]);
    if (squaredDistance < minSquaredDistance) {
      closestPoint[0] = flatCoordinates[offset];
      closestPoint[1] = flatCoordinates[offset + 1];
      return squaredDistance;
    } else {
      return minSquaredDistance;
    }
  }
  goog.asserts.assert(maxDelta > 0);
  var point = [NaN, NaN];
  var index = offset + stride;
  while (index < end) {
    ol.geom.flat.closestPoint(x, y,
        flatCoordinates[index - stride], flatCoordinates[index - stride + 1],
        flatCoordinates[index], flatCoordinates[index + 1], point);
    squaredDistance = ol.geom.flat.squaredDistance(x, y, point[0], point[1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      closestPoint[0] = point[0];
      closestPoint[1] = point[1];
      index += stride;
    } else {
      index += stride * Math.max(
          ((Math.sqrt(squaredDistance) -
            Math.sqrt(minSquaredDistance)) / maxDelta) | 0, 1);
    }
  }
  if (isRing) {
    // check the closing segment
    ol.geom.flat.closestPoint(x, y,
        flatCoordinates[end - stride], flatCoordinates[end - stride + 1],
        flatCoordinates[offset], flatCoordinates[offset + 1], point);
    squaredDistance = ol.geom.flat.squaredDistance(x, y, point[0], point[1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      closestPoint[0] = point[0];
      closestPoint[1] = point[1];
    }
  }
  return minSquaredDistance;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} maxDelta Max delta.
 * @param {boolean} isRing Is ring.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Array.<number>} closestPoint Closest point.
 * @param {number} minSquaredDistance Minimum squared distance.
 * @return {number} Minimum squared distance.
 */
ol.geom.closest.getsClosestPoint = function(flatCoordinates, offset, ends,
    stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    minSquaredDistance = ol.geom.closest.getClosestPoint(
        flatCoordinates, offset, end, stride,
        maxDelta, isRing, x, y, closestPoint, minSquaredDistance);
    offset = end;
  }
  return minSquaredDistance;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} maxDelta Max delta.
 * @param {boolean} isRing Is ring.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Array.<number>} closestPoint Closest point.
 * @param {number} minSquaredDistance Minimum squared distance.
 * @return {number} Minimum squared distance.
 */
ol.geom.closest.getssClosestPoint = function(flatCoordinates, offset, endss,
    stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    minSquaredDistance = ol.geom.closest.getsClosestPoint(
        flatCoordinates, offset, ends, stride,
        maxDelta, isRing, x, y, closestPoint, minSquaredDistance);
    offset = ends[ends.length - 1];
  }
  return minSquaredDistance;
};
