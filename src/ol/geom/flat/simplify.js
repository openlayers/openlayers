/**
 * @module ol/geom/flat/simplify
 */
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

import {squaredDistance, squaredSegmentDistance} from '../../math.js';

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {boolean} highQuality Highest quality.
 * @param {Array<number>} [simplifiedFlatCoordinates] Simplified flat
 *     coordinates.
 * @return {Array<number>} Simplified line string.
 */
export function simplifyLineString(
  flatCoordinates,
  offset,
  end,
  stride,
  squaredTolerance,
  highQuality,
  simplifiedFlatCoordinates
) {
  simplifiedFlatCoordinates =
    simplifiedFlatCoordinates !== undefined ? simplifiedFlatCoordinates : [];
  if (!highQuality) {
    end = radialDistance(
      flatCoordinates,
      offset,
      end,
      stride,
      squaredTolerance,
      simplifiedFlatCoordinates,
      0
    );
    flatCoordinates = simplifiedFlatCoordinates;
    offset = 0;
    stride = 2;
  }
  simplifiedFlatCoordinates.length = douglasPeucker(
    flatCoordinates,
    offset,
    end,
    stride,
    squaredTolerance,
    simplifiedFlatCoordinates,
    0
  );
  return simplifiedFlatCoordinates;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
export function douglasPeucker(
  flatCoordinates,
  offset,
  end,
  stride,
  squaredTolerance,
  simplifiedFlatCoordinates,
  simplifiedOffset
) {
  const n = (end - offset) / stride;
  if (n < 3) {
    for (; offset < end; offset += stride) {
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset];
      simplifiedFlatCoordinates[simplifiedOffset++] =
        flatCoordinates[offset + 1];
    }
    return simplifiedOffset;
  }
  /** @type {Array<number>} */
  const markers = new Array(n);
  markers[0] = 1;
  markers[n - 1] = 1;
  /** @type {Array<number>} */
  const stack = [offset, end - stride];
  let index = 0;
  while (stack.length > 0) {
    const last = stack.pop();
    const first = stack.pop();
    let maxSquaredDistance = 0;
    const x1 = flatCoordinates[first];
    const y1 = flatCoordinates[first + 1];
    const x2 = flatCoordinates[last];
    const y2 = flatCoordinates[last + 1];
    for (let i = first + stride; i < last; i += stride) {
      const x = flatCoordinates[i];
      const y = flatCoordinates[i + 1];
      const squaredDistance = squaredSegmentDistance(x, y, x1, y1, x2, y2);
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
  for (let i = 0; i < n; ++i) {
    if (markers[i]) {
      simplifiedFlatCoordinates[simplifiedOffset++] =
        flatCoordinates[offset + i * stride];
      simplifiedFlatCoordinates[simplifiedOffset++] =
        flatCoordinates[offset + i * stride + 1];
    }
  }
  return simplifiedOffset;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array<number>} simplifiedEnds Simplified ends.
 * @return {number} Simplified offset.
 */
export function douglasPeuckerArray(
  flatCoordinates,
  offset,
  ends,
  stride,
  squaredTolerance,
  simplifiedFlatCoordinates,
  simplifiedOffset,
  simplifiedEnds
) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    simplifiedOffset = douglasPeucker(
      flatCoordinates,
      offset,
      end,
      stride,
      squaredTolerance,
      simplifiedFlatCoordinates,
      simplifiedOffset
    );
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array<Array<number>>} simplifiedEndss Simplified endss.
 * @return {number} Simplified offset.
 */
export function douglasPeuckerMultiArray(
  flatCoordinates,
  offset,
  endss,
  stride,
  squaredTolerance,
  simplifiedFlatCoordinates,
  simplifiedOffset,
  simplifiedEndss
) {
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    const simplifiedEnds = [];
    simplifiedOffset = douglasPeuckerArray(
      flatCoordinates,
      offset,
      ends,
      stride,
      squaredTolerance,
      simplifiedFlatCoordinates,
      simplifiedOffset,
      simplifiedEnds
    );
    simplifiedEndss.push(simplifiedEnds);
    offset = ends[ends.length - 1];
  }
  return simplifiedOffset;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
export function radialDistance(
  flatCoordinates,
  offset,
  end,
  stride,
  squaredTolerance,
  simplifiedFlatCoordinates,
  simplifiedOffset
) {
  if (end <= offset + stride) {
    // zero or one point, no simplification possible, so copy and return
    for (; offset < end; offset += stride) {
      simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset];
      simplifiedFlatCoordinates[simplifiedOffset++] =
        flatCoordinates[offset + 1];
    }
    return simplifiedOffset;
  }
  let x1 = flatCoordinates[offset];
  let y1 = flatCoordinates[offset + 1];
  // copy first point
  simplifiedFlatCoordinates[simplifiedOffset++] = x1;
  simplifiedFlatCoordinates[simplifiedOffset++] = y1;
  let x2 = x1;
  let y2 = y1;
  for (offset += stride; offset < end; offset += stride) {
    x2 = flatCoordinates[offset];
    y2 = flatCoordinates[offset + 1];
    if (squaredDistance(x1, y1, x2, y2) > squaredTolerance) {
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
}

/**
 * @param {number} value Value.
 * @param {number} tolerance Tolerance.
 * @return {number} Rounded value.
 */
export function snap(value, tolerance) {
  return tolerance * Math.round(value / tolerance);
}

/**
 * Simplifies a line string using an algorithm designed by Tim Schaub.
 * Coordinates are snapped to the nearest value in a virtual grid and
 * consecutive duplicate coordinates are discarded.  This effectively preserves
 * topology as the simplification of any subsection of a line string is
 * independent of the rest of the line string.  This means that, for examples,
 * the common edge between two polygons will be simplified to the same line
 * string independently in both polygons.  This implementation uses a single
 * pass over the coordinates and eliminates intermediate collinear points.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @return {number} Simplified offset.
 */
export function quantize(
  flatCoordinates,
  offset,
  end,
  stride,
  tolerance,
  simplifiedFlatCoordinates,
  simplifiedOffset
) {
  // do nothing if the line is empty
  if (offset == end) {
    return simplifiedOffset;
  }
  // snap the first coordinate (P1)
  let x1 = snap(flatCoordinates[offset], tolerance);
  let y1 = snap(flatCoordinates[offset + 1], tolerance);
  offset += stride;
  // add the first coordinate to the output
  simplifiedFlatCoordinates[simplifiedOffset++] = x1;
  simplifiedFlatCoordinates[simplifiedOffset++] = y1;
  // find the next coordinate that does not snap to the same value as the first
  // coordinate (P2)
  let x2, y2;
  do {
    x2 = snap(flatCoordinates[offset], tolerance);
    y2 = snap(flatCoordinates[offset + 1], tolerance);
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
    // snap the next coordinate (P3)
    const x3 = snap(flatCoordinates[offset], tolerance);
    const y3 = snap(flatCoordinates[offset + 1], tolerance);
    offset += stride;
    // skip P3 if it is equal to P2
    if (x3 == x2 && y3 == y2) {
      continue;
    }
    // calculate the delta between P1 and P2
    const dx1 = x2 - x1;
    const dy1 = y2 - y1;
    // calculate the delta between P3 and P1
    const dx2 = x3 - x1;
    const dy2 = y3 - y1;
    // if P1, P2, and P3 are colinear and P3 is further from P1 than P2 is from
    // P1 in the same direction then P2 is on the straight line between P1 and
    // P3
    if (
      dx1 * dy2 == dy1 * dx2 &&
      ((dx1 < 0 && dx2 < dx1) || dx1 == dx2 || (dx1 > 0 && dx2 > dx1)) &&
      ((dy1 < 0 && dy2 < dy1) || dy1 == dy2 || (dy1 > 0 && dy2 > dy1))
    ) {
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
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array<number>} simplifiedEnds Simplified ends.
 * @return {number} Simplified offset.
 */
export function quantizeArray(
  flatCoordinates,
  offset,
  ends,
  stride,
  tolerance,
  simplifiedFlatCoordinates,
  simplifiedOffset,
  simplifiedEnds
) {
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    simplifiedOffset = quantize(
      flatCoordinates,
      offset,
      end,
      stride,
      tolerance,
      simplifiedFlatCoordinates,
      simplifiedOffset
    );
    simplifiedEnds.push(simplifiedOffset);
    offset = end;
  }
  return simplifiedOffset;
}

/**
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Endss.
 * @param {number} stride Stride.
 * @param {number} tolerance Tolerance.
 * @param {Array<number>} simplifiedFlatCoordinates Simplified flat
 *     coordinates.
 * @param {number} simplifiedOffset Simplified offset.
 * @param {Array<Array<number>>} simplifiedEndss Simplified endss.
 * @return {number} Simplified offset.
 */
export function quantizeMultiArray(
  flatCoordinates,
  offset,
  endss,
  stride,
  tolerance,
  simplifiedFlatCoordinates,
  simplifiedOffset,
  simplifiedEndss
) {
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    const simplifiedEnds = [];
    simplifiedOffset = quantizeArray(
      flatCoordinates,
      offset,
      ends,
      stride,
      tolerance,
      simplifiedFlatCoordinates,
      simplifiedOffset,
      simplifiedEnds
    );
    simplifiedEndss.push(simplifiedEnds);
    offset = ends[ends.length - 1];
  }
  return simplifiedOffset;
}
