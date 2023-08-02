/**
 * @module ol/resolution
 */

/**
 * @typedef {number|Array<number>} ResolutionLike
 */

/**
 * @param {ResolutionLike} resolution Resolution.
 * @return {number} Resolution.
 */
export function fromResolutionLike(resolution) {
  if (Array.isArray(resolution)) {
    return Math.min(...resolution);
  }
  return resolution;
}
