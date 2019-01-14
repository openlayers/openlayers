/**
 * @module ol/resolutionconstraint
 */
import {linearFindNearest} from './array.js';
import {clamp} from './math.js';
import {getHeight, getWidth} from './extent';


/**
 * @typedef {function((number|undefined), number, number, import("./size.js").Size, boolean=): (number|undefined)} Type
 */


/**
 * @param {Array<number>} resolutions Resolutions.
 * @param {import("./extent.js").Extent=} opt_maxExtent Maximum allowed extent.
 * @return {Type} Zoom function.
 */
export function createSnapToResolutions(resolutions, opt_maxExtent) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} delta Delta.
     * @param {number} direction Direction.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean=} opt_isMoving True if an interaction or animation is in progress.
     * @return {number|undefined} Resolution.
     */
    function(resolution, delta, direction, size, opt_isMoving) {
      if (resolution !== undefined) {
        let cappedRes = resolution;

        // apply constraint related to max extent
        if (opt_maxExtent) {
          const xResolution = getWidth(opt_maxExtent) / size[0];
          const yResolution = getHeight(opt_maxExtent) / size[1];
          cappedRes = Math.min(cappedRes, Math.min(xResolution, yResolution));
        }

        // during interacting or animating, allow intermediary values
        if (opt_isMoving) {
          // TODO: actually take delta and direction into account
          return Math.min(resolution, cappedRes);
        }

        let z = linearFindNearest(resolutions, cappedRes, direction);
        z = clamp(z + delta, 0, resolutions.length - 1);
        const index = Math.floor(z);
        if (z != index && index < resolutions.length - 1) {
          const power = resolutions[index] / resolutions[index + 1];
          return resolutions[index] / Math.pow(power, z - index);
        } else {
          return resolutions[index];
        }
      } else {
        return undefined;
      }
    }
  );
}


/**
 * @param {number} power Power.
 * @param {number} maxResolution Maximum resolution.
 * @param {number=} opt_maxLevel Maximum level.
 * @param {import("./extent.js").Extent=} opt_maxExtent Maximum allowed extent.
 * @return {Type} Zoom function.
 */
export function createSnapToPower(power, maxResolution, opt_maxLevel, opt_maxExtent) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} delta Delta.
     * @param {number} direction Direction.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean=} opt_isMoving True if an interaction or animation is in progress.
     * @return {number|undefined} Resolution.
     */
    function(resolution, delta, direction, size, opt_isMoving) {
      if (resolution !== undefined) {
        let cappedRes = resolution;

        // apply constraint related to max extent
        if (opt_maxExtent) {
          const xResolution = getWidth(opt_maxExtent) / size[0];
          const yResolution = getHeight(opt_maxExtent) / size[1];
          cappedRes = Math.min(cappedRes, Math.min(xResolution, yResolution));
        }

        // during interacting or animating, allow intermediary values
        if (opt_isMoving) {
          // TODO: actually take delta and direction into account
          return Math.min(resolution, cappedRes);
        }

        const offset = -direction / 2 + 0.5;
        const oldLevel = Math.floor(
          Math.log(maxResolution / cappedRes) / Math.log(power) + offset);
        let newLevel = Math.max(oldLevel + delta, 0);
        if (opt_maxLevel !== undefined) {
          newLevel = Math.min(newLevel, opt_maxLevel);
        }
        return maxResolution / Math.pow(power, newLevel);
      } else {
        return undefined;
      }
    });
}
