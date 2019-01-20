/**
 * @module ol/resolutionconstraint
 */
import {linearFindNearest} from './array.js';
import {clamp} from './math.js';
import {getHeight, getWidth} from './extent';


/**
 * @typedef {function((number|undefined), number, import("./size.js").Size, boolean=): (number|undefined)} Type
 */

/**
 * @param {number} resolution Resolution
 * @param {import("./extent.js").Extent=} maxExtent Maximum allowed extent.
 * @param {import("./size.js").Size} viewportSize Viewport size.
 * @return {number} Capped resolution.
 */
function getCappedResolution(resolution, maxExtent, viewportSize) {
  const xResolution = getWidth(maxExtent) / viewportSize[0];
  const yResolution = getHeight(maxExtent) / viewportSize[1];
  return Math.min(resolution, Math.min(xResolution, yResolution));
}


/**
 * @param {Array<number>} resolutions Resolutions.
 * @param {import("./extent.js").Extent=} opt_maxExtent Maximum allowed extent.
 * @return {Type} Zoom function.
 */
export function createSnapToResolutions(resolutions, opt_maxExtent) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} direction Direction.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean=} opt_isMoving True if an interaction or animation is in progress.
     * @return {number|undefined} Resolution.
     */
    function(resolution, direction, size, opt_isMoving) {
      if (resolution !== undefined) {
        const cappedRes = opt_maxExtent ? getCappedResolution(resolution, opt_maxExtent, size) : resolution;

        // during interacting or animating, allow intermediary values
        if (opt_isMoving) {
          const maxResolution = resolutions[0];
          const minResolution = resolutions[resolutions.length - 1];
          return clamp(cappedRes, minResolution, maxResolution);
        }

        let z = Math.floor(linearFindNearest(resolutions, cappedRes, direction));
        return resolutions[z];
      } else {
        return undefined;
      }
    }
  );
}


/**
 * @param {number} power Power.
 * @param {number} maxResolution Maximum resolution.
 * @param {number=} opt_minResolution Minimum resolution.
 * @param {import("./extent.js").Extent=} opt_maxExtent Maximum allowed extent.
 * @return {Type} Zoom function.
 */
export function createSnapToPower(power, maxResolution, opt_minResolution, opt_maxExtent) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} direction Direction.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean=} opt_isMoving True if an interaction or animation is in progress.
     * @return {number|undefined} Resolution.
     */
    function(resolution, direction, size, opt_isMoving) {
      if (resolution !== undefined) {
        const cappedRes = opt_maxExtent ? getCappedResolution(resolution, opt_maxExtent, size) : resolution;

        // during interacting or animating, allow intermediary values
        if (opt_isMoving) {
          return opt_minResolution !== undefined ? Math.max(opt_minResolution, cappedRes) : cappedRes;
        }

        const offset = -direction * (0.5 - 1e-9) + 0.5;
        const zoomLevel = Math.floor(
          Math.log(maxResolution / cappedRes) / Math.log(power) + offset);
        let newResolution = maxResolution / Math.pow(power, zoomLevel);
        return opt_minResolution !== undefined ?
          clamp(newResolution, opt_minResolution, maxResolution) :
          Math.min(maxResolution, newResolution);
      } else {
        return undefined;
      }
    });
}

/**
 * @param {number} maxResolution Max resolution.
 * @param {number} minResolution Min resolution.
 * @param {import("./extent.js").Extent=} opt_maxExtent Maximum allowed extent.
 * @return {Type} Zoom function.
 */
export function createMinMaxResolution(maxResolution, minResolution, opt_maxExtent) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} direction Direction.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean=} opt_isMoving True if an interaction or animation is in progress.
     * @return {number|undefined} Resolution.
     */
    function(resolution, direction, size, opt_isMoving) {
      if (resolution !== undefined) {
        const cappedRes = opt_maxExtent ? getCappedResolution(resolution, opt_maxExtent, size) : resolution;
        return clamp(cappedRes, minResolution, maxResolution);
      } else {
        return undefined;
      }
    }
  );
}
