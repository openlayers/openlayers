goog.provide('ol.geom.flat.closest');

goog.require('ol');
goog.require('ol.math');


/**
 * Returns the point on the 2D line segment flatCoordinates[offset1] to
 * flatCoordinates[offset2] that is closest to the point (x, y).  Extra
 * dimensions are linearly interpolated.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset1 Offset 1.
 * @param {number} offset2 Offset 2.
 * @param {number} stride Stride.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Array.<number>} closestPoint Closest point.
 */
ol.geom.flat.closest.point = function(flatCoordinates, offset1, offset2, stride, x, y, closestPoint) {
  var x1 = flatCoordinates[offset1];
  var y1 = flatCoordinates[offset1 + 1];
  var dx = flatCoordinates[offset2] - x1;
  var dy = flatCoordinates[offset2 + 1] - y1;
  var i, offset;
  if (dx === 0 && dy === 0) {
    offset = offset1;
  } else {
    var t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      offset = offset2;
    } else if (t > 0) {
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = ol.math.lerp(flatCoordinates[offset1 + i],
            flatCoordinates[offset2 + i], t);
      }
      closestPoint.length = stride;
      return;
    } else {
      offset = offset1;
    }
  }
  for (i = 0; i < stride; ++i) {
    closestPoint[i] = flatCoordinates[offset + i];
  }
  closestPoint.length = stride;
};


/**
 * Return the squared of the largest distance between any pair of consecutive
 * coordinates.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} maxSquaredDelta Max squared delta.
 * @return {number} Max squared delta.
 */
ol.geom.flat.closest.getMaxSquaredDelta = function(flatCoordinates, offset, end, stride, maxSquaredDelta) {
  var x1 = flatCoordinates[offset];
  var y1 = flatCoordinates[offset + 1];
  for (offset += stride; offset < end; offset += stride) {
    var x2 = flatCoordinates[offset];
    var y2 = flatCoordinates[offset + 1];
    var squaredDelta = ol.math.squaredDistance(x1, y1, x2, y2);
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
ol.geom.flat.closest.getsMaxSquaredDelta = function(flatCoordinates, offset, ends, stride, maxSquaredDelta) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    maxSquaredDelta = ol.geom.flat.closest.getMaxSquaredDelta(
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
ol.geom.flat.closest.getssMaxSquaredDelta = function(flatCoordinates, offset, endss, stride, maxSquaredDelta) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    maxSquaredDelta = ol.geom.flat.closest.getsMaxSquaredDelta(
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
 * @param {Array.<number>=} opt_tmpPoint Temporary point object.
 * @return {number} Minimum squared distance.
 */
ol.geom.flat.closest.getClosestPoint = function(flatCoordinates, offset, end,
    stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance,
    opt_tmpPoint) {
  if (offset == end) {
    return minSquaredDistance;
  }
  var i, squaredDistance;
  if (maxDelta === 0) {
    // All points are identical, so just test the first point.
    squaredDistance = ol.math.squaredDistance(
        x, y, flatCoordinates[offset], flatCoordinates[offset + 1]);
    if (squaredDistance < minSquaredDistance) {
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = flatCoordinates[offset + i];
      }
      closestPoint.length = stride;
      return squaredDistance;
    } else {
      return minSquaredDistance;
    }
  }
  ol.DEBUG && console.assert(maxDelta > 0, 'maxDelta should be larger than 0');
  var tmpPoint = opt_tmpPoint ? opt_tmpPoint : [NaN, NaN];
  var index = offset + stride;
  while (index < end) {
    ol.geom.flat.closest.point(
        flatCoordinates, index - stride, index, stride, x, y, tmpPoint);
    squaredDistance = ol.math.squaredDistance(x, y, tmpPoint[0], tmpPoint[1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = tmpPoint[i];
      }
      closestPoint.length = stride;
      index += stride;
    } else {
      // Skip ahead multiple points, because we know that all the skipped
      // points cannot be any closer than the closest point we have found so
      // far.  We know this because we know how close the current point is, how
      // close the closest point we have found so far is, and the maximum
      // distance between consecutive points.  For example, if we're currently
      // at distance 10, the best we've found so far is 3, and that the maximum
      // distance between consecutive points is 2, then we'll need to skip at
      // least (10 - 3) / 2 == 3 (rounded down) points to have any chance of
      // finding a closer point.  We use Math.max(..., 1) to ensure that we
      // always advance at least one point, to avoid an infinite loop.
      index += stride * Math.max(
          ((Math.sqrt(squaredDistance) -
            Math.sqrt(minSquaredDistance)) / maxDelta) | 0, 1);
    }
  }
  if (isRing) {
    // Check the closing segment.
    ol.geom.flat.closest.point(
        flatCoordinates, end - stride, offset, stride, x, y, tmpPoint);
    squaredDistance = ol.math.squaredDistance(x, y, tmpPoint[0], tmpPoint[1]);
    if (squaredDistance < minSquaredDistance) {
      minSquaredDistance = squaredDistance;
      for (i = 0; i < stride; ++i) {
        closestPoint[i] = tmpPoint[i];
      }
      closestPoint.length = stride;
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
 * @param {Array.<number>=} opt_tmpPoint Temporary point object.
 * @return {number} Minimum squared distance.
 */
ol.geom.flat.closest.getsClosestPoint = function(flatCoordinates, offset, ends,
    stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance,
    opt_tmpPoint) {
  var tmpPoint = opt_tmpPoint ? opt_tmpPoint : [NaN, NaN];
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    minSquaredDistance = ol.geom.flat.closest.getClosestPoint(
        flatCoordinates, offset, end, stride,
        maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint);
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
 * @param {Array.<number>=} opt_tmpPoint Temporary point object.
 * @return {number} Minimum squared distance.
 */
ol.geom.flat.closest.getssClosestPoint = function(flatCoordinates, offset,
    endss, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance,
    opt_tmpPoint) {
  var tmpPoint = opt_tmpPoint ? opt_tmpPoint : [NaN, NaN];
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    minSquaredDistance = ol.geom.flat.closest.getsClosestPoint(
        flatCoordinates, offset, ends, stride,
        maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint);
    offset = ends[ends.length - 1];
  }
  return minSquaredDistance;
};
