/**
 * @module ol/geom/flat/orient
 */
import {coordinates as reverseCoordinates} from './reverse.js';

/**
 * Is the linear ring oriented clockwise in a coordinate system with a bottom-left
 * coordinate origin? For a coordinate system with a top-left coordinate origin,
 * the ring's orientation is clockwise when this function returns false.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {boolean} Is clockwise.
 */
export function linearRingIsClockwise(flatCoordinates, offset, end, stride) {
  // https://stackoverflow.com/a/1180256/2389327
  // https://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
  if ((end - offset) / stride >= 3) {
    const minVertex = findCornerVertex(flatCoordinates, offset, end, stride);
    // Orientation matrix:
    //     [ 1  xa  ya ]
    // O = | 1  xb  yb |
    //     [ 1  xc  yc ]
    const previousVertex = findUniqueVertex(
      flatCoordinates,
      offset,
      end,
      stride,
      minVertex,
      -1
    );
    const nextVertex = findUniqueVertex(
      flatCoordinates,
      offset,
      end,
      stride,
      minVertex,
      1
    );
    const aX = flatCoordinates[previousVertex];
    const aY = flatCoordinates[previousVertex + 1];
    const bX = flatCoordinates[minVertex];
    const bY = flatCoordinates[minVertex + 1];
    const cX = flatCoordinates[nextVertex];
    const cY = flatCoordinates[nextVertex + 1];
    const determinant =
      bX * cY + aX * bY + aY * cX - (aY * bX + bY * cX + aX * cY);

    return determinant < 0;
  }
}

/**
 * Finds the next unique vertex in forward or backward direction of a ring.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @param {number} start Start vertex.
 * @param {number} direction 1 for forward, -1 for backward.
 * @return {number} vertex Index of the found vertex.
 */
function findUniqueVertex(
  flatCoordinates,
  offset,
  end,
  stride,
  start,
  direction
) {
  let previousX, previousY, x, y;
  let i = start;
  while (x === previousX && y === previousY) {
    previousX = flatCoordinates[i];
    previousY = flatCoordinates[i + 1];
    i += direction * stride;
    if (i >= end) {
      i = offset;
    } else if (i < offset) {
      i = end - stride;
    }
    x = flatCoordinates[i];
    y = flatCoordinates[i + 1];
  }
  return i;
}

/**
 * Find vertex along one edge of bounding box.
 * In this case, we find smallest y; in case of tie also smallest x.
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {number} Corner vertex.
 */
function findCornerVertex(flatCoordinates, offset, end, stride) {
  let iMinVertex = -1;
  let minY = Infinity;
  let minXAtMinY = Infinity;
  for (let i = offset; i < end; i += stride) {
    const x = flatCoordinates[i];
    const y = flatCoordinates[i + 1];
    if (y > minY) {
      continue;
    }
    if (y == minY) {
      if (x >= minXAtMinY) {
        continue;
      }
    }

    // Minimum so far.
    iMinVertex = i;
    minY = y;
    minXAtMinY = x;
  }

  return iMinVertex;
}

/**
 * Determines if linear rings are oriented.  By default, left-hand orientation
 * is tested (first ring must be clockwise, remaining rings counter-clockwise).
 * To test for right-hand orientation, use the `opt_right` argument.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Array of end indexes.
 * @param {number} stride Stride.
 * @param {boolean=} opt_right Test for right-hand orientation
 *     (counter-clockwise exterior ring and clockwise interior rings).
 * @return {boolean} Rings are correctly oriented.
 */
export function linearRingsAreOriented(
  flatCoordinates,
  offset,
  ends,
  stride,
  opt_right
) {
  const right = opt_right !== undefined ? opt_right : false;
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    const isClockwise = linearRingIsClockwise(
      flatCoordinates,
      offset,
      end,
      stride
    );
    if (i === 0) {
      if ((right && isClockwise) || (!right && !isClockwise)) {
        return false;
      }
    } else {
      if ((right && !isClockwise) || (!right && isClockwise)) {
        return false;
      }
    }
    offset = end;
  }
  return true;
}

/**
 * Determines if linear rings are oriented.  By default, left-hand orientation
 * is tested (first ring must be clockwise, remaining rings counter-clockwise).
 * To test for right-hand orientation, use the `opt_right` argument.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Array of array of end indexes.
 * @param {number} stride Stride.
 * @param {boolean=} opt_right Test for right-hand orientation
 *     (counter-clockwise exterior ring and clockwise interior rings).
 * @return {boolean} Rings are correctly oriented.
 */
export function linearRingssAreOriented(
  flatCoordinates,
  offset,
  endss,
  stride,
  opt_right
) {
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    const ends = endss[i];
    if (
      !linearRingsAreOriented(flatCoordinates, offset, ends, stride, opt_right)
    ) {
      return false;
    }
    if (ends.length) {
      offset = ends[ends.length - 1];
    }
  }
  return true;
}

/**
 * Orient coordinates in a flat array of linear rings.  By default, rings
 * are oriented following the left-hand rule (clockwise for exterior and
 * counter-clockwise for interior rings).  To orient according to the
 * right-hand rule, use the `opt_right` argument.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<number>} ends Ends.
 * @param {number} stride Stride.
 * @param {boolean=} opt_right Follow the right-hand rule for orientation.
 * @return {number} End.
 */
export function orientLinearRings(
  flatCoordinates,
  offset,
  ends,
  stride,
  opt_right
) {
  const right = opt_right !== undefined ? opt_right : false;
  for (let i = 0, ii = ends.length; i < ii; ++i) {
    const end = ends[i];
    const isClockwise = linearRingIsClockwise(
      flatCoordinates,
      offset,
      end,
      stride
    );
    const reverse =
      i === 0
        ? (right && isClockwise) || (!right && !isClockwise)
        : (right && !isClockwise) || (!right && isClockwise);
    if (reverse) {
      reverseCoordinates(flatCoordinates, offset, end, stride);
    }
    offset = end;
  }
  return offset;
}

/**
 * Orient coordinates in a flat array of linear rings.  By default, rings
 * are oriented following the left-hand rule (clockwise for exterior and
 * counter-clockwise for interior rings).  To orient according to the
 * right-hand rule, use the `opt_right` argument.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {Array<Array<number>>} endss Array of array of end indexes.
 * @param {number} stride Stride.
 * @param {boolean=} opt_right Follow the right-hand rule for orientation.
 * @return {number} End.
 */
export function orientLinearRingsArray(
  flatCoordinates,
  offset,
  endss,
  stride,
  opt_right
) {
  for (let i = 0, ii = endss.length; i < ii; ++i) {
    offset = orientLinearRings(
      flatCoordinates,
      offset,
      endss[i],
      stride,
      opt_right
    );
  }
  return offset;
}
