/**
 * @module ol/reproj/common
 */

/**
 * Default maximum allowed threshold  (in pixels) for reprojection
 * triangulation.
 * @type {number}
 */
export const ERROR_THRESHOLD = 0.5;

/**
 * Enable automatic reprojection of raster sources. Default is `true`.
 * TODO: decide if we want to expose this as a build flag or remove it
 * @type {boolean}
 */
export const ENABLE_RASTER_REPROJECTION = true;
