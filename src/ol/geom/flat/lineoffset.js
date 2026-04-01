import {angleBetween} from '../../coordinate.js';

/**
 * Offsets a line string to the left / right along its segments direction.
 * Offset is applied to each segment of the line in the direciton of the segment normal (positive offset goes "right" relative to the line direction).
 * For very sharp angles between segments, the function falls back to offsetting along the segment normal direction to avoid excessively long miters.
 *
 * Coordinates and the offset should be in the same units — either pixels or the same spatial reference system as the input line coordinates.
 *
 * @param {Array<number>} flatCoordinates Flat coordinates.
 * @param {number} start Start index.
 * @param {number} end End index.
 * @param {number} stride Stride.
 * @param {number} offset Offset distance along the segment normal direction.
 *   Positive values offset to the right relative to the direction of the line.
 *   Negative values offset to the left.
 * @param {boolean} isClosedRing If coordinates build a closed circle (in this the first and the last coordinate offsets will consider previous / next ring coordinate)
 * @param {Array<number>} [dest] Destination coordinate array. If not provided a new one will be created
 * @param {number} [destinationStride] Stride of destination coordinates. If unspecified, assumed to be same as the source coordinates stride.
 * @return {Array<number>} Result flat coordinates of the offset line.
 */
export function offsetLineString(
  flatCoordinates,
  start,
  end,
  stride,
  offset,
  isClosedRing,
  dest,
  destinationStride,
) {
  dest = dest ?? [];
  destinationStride = destinationStride ?? stride;

  const secondPointX = flatCoordinates[start + stride];
  const secondPointY = flatCoordinates[start + stride + 1];
  const secondToLastPointX = flatCoordinates[end - 2 * stride];
  const secondToLastPointY = flatCoordinates[end - 2 * stride + 1];
  let x, y, prevX, prevY, nextX, nextY, offsetX, offsetY;

  let i = 0;
  for (let j = start; j < end; j += stride) {
    // 1. Detect previous and next coordinates of a current vertex
    prevX = x;
    prevY = y;
    nextX = undefined;
    nextY = undefined;
    if (j + stride < end) {
      nextX = flatCoordinates[j + stride];
      nextY = flatCoordinates[j + stride + 1];
    }
    // First coordinate of a closed ring -> previous coordinate is the second to last one
    if (isClosedRing && j === start) {
      prevX = secondToLastPointX;
      prevY = secondToLastPointY;
    }
    // Last coordinate of a closed ring -> next coordinate is the second vertex of a line string (the last one is same as the first one for a closed ring)
    if (isClosedRing && j === end - stride) {
      nextX = secondPointX;
      nextY = secondPointY;
    }

    // 2. Current vertex to offset
    x = flatCoordinates[j];
    y = flatCoordinates[j + 1];

    // 3. Offset the vertex
    [offsetX, offsetY] = offsetLineVertex(
      x,
      y,
      prevX,
      prevY,
      nextX,
      nextY,
      offset,
    );
    dest[i++] = offsetX;
    dest[i++] = offsetY;

    // 4. Copy over other dimension values if any
    for (let k = 2; k < destinationStride; k++) {
      dest[i++] = flatCoordinates[j + k];
    }
  }

  if (dest.length != i) {
    dest.length = i;
  }
  return dest;
}

/**
 * Computes the offset of a single vertex of a line string.
 *
 * The function calculates a new vertex coordinate offset along the normal/miter direction of the line at this vertex.
 * Offset is applied along the segment normal (positive offset goes "right" relative to the line direction).
 * It handles first and last vertices (caps) as well as joins between two segments (mitering).
 * For very sharp angles, the function falls back to offsetting along the segment normal direction to avoid excessively long miters.
 *
 * Coordinates and the offset should be in the same units — either pixels or the same spatial reference system as the input line coordinates.
 *
 * @param {number} x Vertex x-coordinate.
 * @param {number} y Vertex y-coordinate.
 * @param {number|undefined} prevX Previous vertex x-coordinate.
 *   Pass undefined if computing the offset for the first vertex (no previous vertex).
 * @param {number|undefined} prevY Previous vertex y-coordinate.
 *   Pass undefined if computing the offset for the first vertex (no previous vertex).
 * @param {number|undefined} nextX Next vertex x-coordinate.
 *   Pass undefined if computing the offset for the last vertex (no next vertex).
 * @param {number|undefined} nextY Next vertex y-coordinate.
 *   Pass undefined if computing the offset for the last vertex (no next vertex).
 * @param {number} offset Offset distance along the segment normal direction.
 *   Positive values offset to the right relative to the direction from previous to next vertex.
 *   Negative values offset to the left.
 * @return {import("../../coordinate.js").Coordinate} Offset vertex coordinate as `[x, y]`.
 */
function offsetLineVertex(x, y, prevX, prevY, nextX, nextY, offset) {
  // Compute segment direction
  let nx, ny;
  if (prevX !== undefined && prevY !== undefined) {
    nx = x - prevX;
    ny = y - prevY;
  } else if (nextX !== undefined && nextY !== undefined) {
    nx = nextX - x;
    ny = nextY - y;
  } else {
    // no next, no previous point given -> just assume some default (horizontal) direction
    nx = 1;
    ny = 0;
  }

  // Normalize -> tangent
  const len = Math.hypot(nx, ny);
  const tx = nx / len;
  const ty = ny / len;

  // Rotate tangent 90° -> normal
  nx = -ty;
  ny = tx;

  // First / last vertex -> offset the point in the direction of the normal vector
  if (prevX === undefined || prevY === undefined) {
    return [x + nx * offset, y + ny * offset];
  }
  if (nextX === undefined || nextY === undefined) {
    return [x + nx * offset, y + ny * offset];
  }

  // Compute join angle - angle between 2 segments of the vertex.
  const joinAngle = angleBetween([x, y], [prevX, prevY], [nextX, nextY]);

  // Avoid huge or infinite miter joins for very sharp angles, offset in the segment direction in this case.
  if (Math.cos(joinAngle) > 0.998) {
    return [x + tx * offset, y + ty * offset];
  }

  // Compute join offset direction.
  // We rotate the normal vector by half of the join angle.
  // This gives the direction of the miter at the vertex.
  const cos = Math.cos(joinAngle / 2);
  const sin = Math.sin(joinAngle / 2);

  // Rotate the normal vector (nx, ny) by half of the join angle.
  // bx/by = bisector direction before normalization
  const bx = sin * nx + cos * ny;
  const by = -cos * nx + sin * ny;

  // Scale the bisector so that moving along it preserves the correct offset distance.
  // Dividing by sin(half of angle) converts the bisector into the true miter vector.
  // (This expands the miter for sharp angles and shortens it for wide ones.)
  const dx = bx * (1 / sin);
  const dy = by * (1 / sin);

  // Offset final vertex along miter direction
  return [x + dx * offset, y + dy * offset];
}

/**
 * Removes self-intersection loops (cycles) from an offset line.
 * When a polyline is offset, sharp turns can create self-intersecting loops.
 * This function detects those crossings and splices out the looped portions,
 * replacing them with the intersection point.
 *
 * @param {Array<number>} coords Flat offset coordinates (modified in-place).
 * @param {number} stride Coordinate stride (typically 2).
 * @return {Array<number>} The cleaned coordinate array.
 */
export function removeOffsetCycles(coords, stride) {
  for (let i = 0, ii = coords.length - 2; i < ii; i += stride) {
    for (let j = coords.length - 2 * stride; j > i + stride; j -= stride) {
      const p1x = coords[i];
      const p1y = coords[i + 1];
      const p2x = coords[i + stride];
      const p2y = coords[i + stride + 1];
      const p3x = coords[j];
      const p3y = coords[j + 1];
      const p4x = coords[j + stride];
      const p4y = coords[j + stride + 1];
      const d = (p4y - p3y) * (p2x - p1x) - (p4x - p3x) * (p2y - p1y);
      if (d === 0) {
        continue;
      }
      const t = ((p4x - p3x) * (p1y - p3y) - (p4y - p3y) * (p1x - p3x)) / d;
      const u = ((p2x - p1x) * (p1y - p3y) - (p2y - p1y) * (p1x - p3x)) / d;
      if (t > 0 && t < 1 && u > 0 && u < 1) {
        const ix = p1x + t * (p2x - p1x);
        const iy = p1y + t * (p2y - p1y);
        coords[i + stride] = ix;
        coords[i + stride + 1] = iy;
        coords.splice(i + 2 * stride, j - i - stride);
        break;
      }
    }
  }
  return coords;
}
