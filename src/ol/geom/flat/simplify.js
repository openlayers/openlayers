// Based on simplify-js https://github.com/mourner/simplify-js
// Copyright (c) 2012, Vladimir Agafonkin
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//
//    2. Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

goog.provide('ol.geom.flat.simplify');

goog.require('ol.math');


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {boolean} highQuality Highest quality.
 * @param {Array.<number>=} opt_simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @return {Array.<number>} Simplified line string.
 */
ol.geom.flat.simplify.lineString = function(flatCoordinates, offset, end,
    stride, squaredTolerance, highQuality, opt_simplifiedFlatCoordinates) {
  var simplifiedFlatCoordinates = opt_simplifiedFlatCoordinates !== undefined ?
    opt_simplifiedFlatCoordinates : [];
  if (!highQuality) {
    end = ol.geom.flat.simplify.radialDistance(flatCoordinates, offset, end,
        stride, squaredTolerance,
        simplifiedFlatCoordinates, 0);
    flatCoordinates = simplifiedFlatCoordinates;
    offset = 0;
    stride = 2;
  }
  simplifiedFlatCoordinates.length = ol.geom.flat.simplify.douglasPeucker(
      flatCoordinates, offset, end, stride, squaredTolerance,
      simplifiedFlatCoordinates, 0);
  return simplifiedFlatCoordinates;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array.<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
ol.geom.flat.simplify.douglasPeucker = function(flatCoordinates, offset, end,
    stride, squaredTolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  var n = (end - offset) / stride;
  if (n < 3) {
    for (; offset < end; offset += stride) {
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset];
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset + 1];
    }
    return simplifiedOffset;
  }
  /** @type {Array.<number>} */
  var markers = new Array(n);
  markers[0] = 1;
  markers[n - 1] = 1;
  /** @type {Array.<number>} */
  var stack = [offset, end - stride];
  var index = 0;
  var i;
  while (stack.length > 0) {
    var last = stack.pop();
    var first = stack.pop();
    var maxSquaredDistance = 0;
    var x1 = flatCoordinates[first];
    var y1 = flatCoordinates[first + 1];
    var x2 = flatCoordinates[last];
    var y2 = flatCoordinates[last + 1];
    for (i = first + stride; i < last; i += stride) {
      var x = flatCoordinates[i];
      var y = flatCoordinates[i + 1];
      var squaredDistance = ol.math.squaredSegmentDistance(
          x, y, x1, y1, x2, y2);
      if (squaredDistance > maxSquaredDistance) {
        index = i;
        maxSquaredDistance = squaredDistance;
      }
    }
    if (maxSquaredDistance > squaredTolerance) {
      markers[(index - offset) / stride] = 1;
      if (first + stride < index) {
        stack.push(first, index);
      }
      if (index + stride < last) {
        stack.push(index, last);
      }
    }
  }
  for (i = 0; i < n; ++i) {
    if (markers[i]) {
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset + i * stride];
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset + i * stride + 1];
    }
  }
  return simplifiedOffset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array.<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array.<number>} simplifiedEnds Simplified ends.
 * @return {number} Simplified offset.
 */
ol.geom.flat.simplify.douglasPeuckers = function(flatCoordinates, offset,
    ends, stride, squaredTolerance, simplifiedFlatCoordinates,
    simplifiedOffset, simplifiedEnds) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    simplifiedOffset = ol.geom.flat.simplify.douglasPeucker(
        flatCoordinates, offset, end, stride, squaredTolerance,
        simplifiedFlatCoordinates, simplifiedOffset);
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array.<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array.<Array.<number>>} simplifiedEndss Simplified endss.
 * @return {number} Simplified offset.
 */
ol.geom.flat.simplify.douglasPeuckerss = function(
    flatCoordinates, offset, endss, stride, squaredTolerance,
    simplifiedFlatCoordinates, simplifiedOffset, simplifiedEndss) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    var simplifiedEnds = [];
    simplifiedOffset = ol.geom.flat.simplify.douglasPeuckers(
        flatCoordinates, offset, ends, stride, squaredTolerance,
        simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds);
    simplifiedEndss.push(simplifiedEnds);
    offset = ends[ends.length - 1];
  }
  return simplifiedOffset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array.<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
ol.geom.flat.simplify.radialDistance = function(flatCoordinates, offset, end,
    stride, squaredTolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  if (end <= offset + stride) {
    // zero or one point, no simplification possible, so copy and return
    for (; offset < end; offset += stride) {
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset];
      simplifiedFlatCoordinates[simplifiedOffset++] =
          flatCoordinates[offset + 1];
    }
    return simplifiedOffset;
  }
  var x1 = flatCoordinates[offset];
  var y1 = flatCoordinates[offset + 1];
  // copy first point
  simplifiedFlatCoordinates[simplifiedOffset++] = x1;
  simplifiedFlatCoordinates[simplifiedOffset++] = y1;
  var x2 = x1;
  var y2 = y1;
  for (offset += stride; offset < end; offset += stride) {
    x2 = flatCoordinates[offset];
    y2 = flatCoordinates[offset + 1];
    if (ol.math.squaredDistance(x1, y1, x2, y2) > squaredTolerance) {
      // copy point at offset
      simplifiedFlatCoordinates[simplifiedOffset++] = x2;
      simplifiedFlatCoordinates[simplifiedOffset++] = y2;
      x1 = x2;
      y1 = y2;
    }
  }
  if (x2 != x1 || y2 != y1) {
    // copy last point
    simplifiedFlatCoordinates[simplifiedOffset++] = x2;
    simplifiedFlatCoordinates[simplifiedOffset++] = y2;
  }
  return simplifiedOffset;
};


/**
 * @param {number} value Value.
 * @param {number} tolerance Tolerance.
 * @return {number} Rounded value.
 */
ol.geom.flat.simplify.snap = function(value, tolerance) {
  return tolerance * Math.round(value / tolerance);
};


/**
 * Simplifies a line string using an algorithm designed by Tim Schaub.
 * Coordinates are snapped to the nearest value in a virtual grid and
 * consecutive duplicate coordinates are discarded.  This effectively preserves
 * topology as the simplification of any subsection of a line string is
 * independent of the rest of the line string.  This means that, for examples,
 * the common edge between two polygons will be simplified to the same line
 * string independently in both polygons.  This implementation uses a single
 * pass over the coordinates and eliminates intermediate collinear points.
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array.<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
ol.geom.flat.simplify.quantize = function(flatCoordinates, offset, end, stride,
    tolerance, simplifiedFlatCoordinates, simplifiedOffset) {
  // do nothing if the line is empty
  if (offset == end) {
    return simplifiedOffset;
  }
  // snap the first coordinate (P1)
  var x1 = ol.geom.flat.simplify.snap(flatCoordinates[offset], tolerance);
  var y1 = ol.geom.flat.simplify.snap(flatCoordinates[offset + 1], tolerance);
  offset += stride;
  // add the first coordinate to the output
  simplifiedFlatCoordinates[simplifiedOffset++] = x1;
  simplifiedFlatCoordinates[simplifiedOffset++] = y1;
  // find the next coordinate that does not snap to the same value as the first
  // coordinate (P2)
  var x2, y2;
  do {
    x2 = ol.geom.flat.simplify.snap(flatCoordinates[offset], tolerance);
    y2 = ol.geom.flat.simplify.snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    if (offset == end) {
      // all coordinates snap to the same value, the line collapses to a point
      // push the last snapped value anyway to ensure that the output contains
      // at least two points
      // FIXME should we really return at least two points anyway?
      simplifiedFlatCoordinates[simplifiedOffset++] = x2;
      simplifiedFlatCoordinates[simplifiedOffset++] = y2;
      return simplifiedOffset;
    }
  } while (x2 == x1 && y2 == y1);
  while (offset < end) {
    var x3, y3;
    // snap the next coordinate (P3)
    x3 = ol.geom.flat.simplify.snap(flatCoordinates[offset], tolerance);
    y3 = ol.geom.flat.simplify.snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    // skip P3 if it is equal to P2
    if (x3 == x2 && y3 == y2) {
      continue;
    }
    // calculate the delta between P1 and P2
    var dx1 = x2 - x1;
    var dy1 = y2 - y1;
    // calculate the delta between P3 and P1
    var dx2 = x3 - x1;
    var dy2 = y3 - y1;
    // if P1, P2, and P3 are colinear and P3 is further from P1 than P2 is from
    // P1 in the same direction then P2 is on the straight line between P1 and
    // P3
    if ((dx1 * dy2 == dy1 * dx2) &&
        ((dx1 < 0 && dx2 < dx1) || dx1 == dx2 || (dx1 > 0 && dx2 > dx1)) &&
        ((dy1 < 0 && dy2 < dy1) || dy1 == dy2 || (dy1 > 0 && dy2 > dy1))) {
      // discard P2 and set P2 = P3
      x2 = x3;
      y2 = y3;
      continue;
    }
    // either P1, P2, and P3 are not colinear, or they are colinear but P3 is
    // between P3 and P1 or on the opposite half of the line to P2.  add P2,
    // and continue with P1 = P2 and P2 = P3
    simplifiedFlatCoordinates[simplifiedOffset++] = x2;
    simplifiedFlatCoordinates[simplifiedOffset++] = y2;
    x1 = x2;
    y1 = y2;
    x2 = x3;
    y2 = y3;
  }
  // add the last point (P2)
  simplifiedFlatCoordinates[simplifiedOffset++] = x2;
  simplifiedFlatCoordinates[simplifiedOffset++] = y2;
  return simplifiedOffset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array.<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array.<number>} simplifiedEnds Simplified ends.
 * @return {number} Simplified offset.
 */
ol.geom.flat.simplify.quantizes = function(
    flatCoordinates, offset, ends, stride,
    tolerance,
    simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds) {
  var i, ii;
  for (i = 0, ii = ends.length; i < ii; ++i) {
    var end = ends[i];
    simplifiedOffset = ol.geom.flat.simplify.quantize(
        flatCoordinates, offset, end, stride,
        tolerance,
        simplifiedFlatCoordinates, simplifiedOffset);
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array.<Array.<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array.<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array.<Array.<number>>} simplifiedEndss Simplified endss.
 * @return {number} Simplified offset.
 */
ol.geom.flat.simplify.quantizess = function(
    flatCoordinates, offset, endss, stride,
    tolerance,
    simplifiedFlatCoordinates, simplifiedOffset, simplifiedEndss) {
  var i, ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    var ends = endss[i];
    var simplifiedEnds = [];
    simplifiedOffset = ol.geom.flat.simplify.quantizes(
        flatCoordinates, offset, ends, stride,
        tolerance,
        simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds);
    simplifiedEndss.push(simplifiedEnds);
    offset = ends[ends.length - 1];
  }
  return simplifiedOffset;
};
