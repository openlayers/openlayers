/**
 * @module ol/render/webgpu/localGrid
 */

/**
 * Steps each axis of a batch's extent is divided into before positions are
 * stored as int16.
 *
 * Vertices are kept relative to the batch rather than in map units, which
 * float32 cannot hold to sub-metre accuracy at web mercator's scale. The step
 * is the extent divided by this, so it is the extent, not the number, that
 * decides how fine the geometry can be: a batch covering a degree resolves to
 * centimetres, one covering the world to tens of metres. What is left over of
 * the int16 range takes geometry that reaches a little outside the extent,
 * such as the far side of a wide stroke.
 *
 * @type {number}
 */
export const LOCAL_EXTENT = 8192;
