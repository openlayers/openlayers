goog.provide('ol.geom.flat.interpolate');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.math');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} fraction Fraction.
 * @param {Array.<number>=} opt_dest Destination.
 * @return {Array.<number>} Destination.
 */
ol.geom.flat.interpolate.lineString = function(flatCoordinates, offset, end, stride, fraction, opt_dest) {
  // FIXME does not work when vertices are repeated
  // FIXME interpolate extra dimensions
  ol.DEBUG && console.assert(0 <= fraction && fraction <= 1,
      'fraction should be in between 0 and 1');
  var pointX = NaN;
  var pointY = NaN;
  var n = (end - offset) / stride;
  if (n === 0) {
    ol.DEBUG && console.assert(false, 'n cannot be 0');
  } else if (n == 1) {
    pointX = flatCoordinates[offset];
    pointY = flatCoordinates[offset + 1];
  } else if (n == 2) {
    pointX = (1 - fraction) * flatCoordinates[offset] +
        fraction * flatCoordinates[offset + stride];
    pointY = (1 - fraction) * flatCoordinates[offset + 1] +
        fraction * flatCoordinates[offset + stride + 1];
  } else {
    var x1 = flatCoordinates[offset];
    var y1 = flatCoordinates[offset + 1];
    var length = 0;
    var cumulativeLengths = [0];
    var i;
    for (i = offset + stride; i < end; i += stride) {
      var x2 = flatCoordinates[i];
      var y2 = flatCoordinates[i + 1];
      length += Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      cumulativeLengths.push(length);
      x1 = x2;
      y1 = y2;
    }
    var target = fraction * length;
    var index = ol.array.binarySearch(cumulativeLengths, target);
    if (index < 0) {
      var t = (target - cumulativeLengths[-index - 2]) /
          (cumulativeLengths[-index - 1] - cumulativeLengths[-index - 2]);
      var o = offset + (-index - 2) * stride;
      pointX = ol.math.lerp(
          flatCoordinates[o], flatCoordinates[o + stride], t);
      pointY = ol.math.lerp(
          flatCoordinates[o + 1], flatCoordinates[o + stride + 1], t);
    } else {
      pointX = flatCoordinates[offset + index * stride];
      pointY = flatCoordinates[offset + index * stride + 1];
    }
  }
  if (opt_dest) {
    opt_dest[0] = pointX;
    opt_dest[1] = pointY;
    return opt_dest;
  } else {
    return [pointX, pointY];
  }
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} m M.
 * @param {boolean} extrapolate Extrapolate.
 * @return {ol.Coordinate} Coordinate.
 */
ol.geom.flat.interpolate.lineStringCoordinateAtM = function(flatCoordinates, offset, end, stride, m, extrapolate) {
  if (end == offset) {
    return null;
  }
  var coordinate;
  if (m < flatCoordinates[offset + stride - 1]) {
    if (extrapolate) {
      coordinate = flatCoordinates.slice(offset, offset + stride);
      coordinate[stride - 1] = m;
      return coordinate;
    } else {
      return null;
    }
  } else if (flatCoordinates[end - 1] < m) {
    if (extrapolate) {
      coordinate = flatCoordinates.slice(end - stride, end);
      coordinate[stride - 1] = m;
      return coordinate;
    } else {
      return null;
    }
  }
  // FIXME use O(1) search
  if (m == flatCoordinates[offset + stride - 1]) {
    return flatCoordinates.slice(offset, offset + stride);
  }
  var lo = offset / stride;
  var hi = end / stride;
  while (lo < hi) {
    var mid = (lo + hi) >> 1;
    if (m < flatCoordinates[(mid + 1) * stride - 1]) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  var m0 = flatCoordinates[lo * stride - 1];
  if (m == m0) {
    return flatCoordinates.slice((lo - 1) * stride, (lo - 1) * stride + stride);
  }
  var m1 = flatCoordinates[(lo + 1) * stride - 1];
  ol.DEBUG && console.assert(m0 < m, 'm0 should be less than m');
  ol.DEBUG && console.assert(m <= m1, 'm should be less than or equal to m1');
  var t = (m - m0) / (m1 - m0);
  coordinate = [];
  var i;
  for (i = 0; i < stride - 1; ++i) {
    coordinate.push(ol.math.lerp(flatCoordinates[(lo - 1) * stride + i],
        flatCoordinates[lo * stride + i], t));
  }
  coordinate.push(m);
  ol.DEBUG && console.assert(coordinate.length == stride,
      'length of coordinate array should match stride');
  return coordinate;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} m M.
 * @param {boolean} extrapolate Extrapolate.
 * @param {boolean} interpolate Interpolate.
 * @return {ol.Coordinate} Coordinate.
 */
ol.geom.flat.interpolate.lineStringsCoordinateAtM = function(
    flatCoordinates, offset, ends, stride, m, extrapolate, interpolate) {
  if (interpolate) {
    return ol.geom.flat.interpolate.lineStringCoordinateAtM(
        flatCoordinates, offset, ends[ends.length - 1], stride, m, extrapolate);
  }
  var coordinate;
  if (m < flatCoordinates[stride - 1]) {
    if (extrapolate) {
      coordinate = flatCoordinates.slice(0, stride);
      coordinate[stride - 1] = m;
      return coordinate;
    } else {
      return null;
    }
  }
  if (flatCoordinates[flatCoordinates.length - 1] < m) {
    if (extrapolate) {
      coordinate = flatCoordinates.slice(flatCoordinates.length - stride);
      coordinate[stride - 1] = m;
      return coordinate;
    } else {
      return null;
    }
  }
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    if (offset == end) {
      continue;
    }
    if (m < flatCoordinates[offset + stride - 1]) {
      return null;
    } else if (m <= flatCoordinates[end - 1]) {
      return ol.geom.flat.interpolate.lineStringCoordinateAtM(
          flatCoordinates, offset, end, stride, m, false);
    }
    offset = end;
  }
  ol.DEBUG && console.assert(false,
      'ol.geom.flat.interpolate.lineStringsCoordinateAtM should have returned');
  return null;
};
