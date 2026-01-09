import {angleBetween} from '../../math.js';

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
export function offsetLineVertex(x, y, prevX, prevY, nextX, nextY, offset) {
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
