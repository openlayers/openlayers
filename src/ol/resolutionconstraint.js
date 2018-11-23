/**
 * @module ol/resolutionconstraint
 */
import {linearFindNearest} from './array.js';
import {createEmpty, getHeight, getWidth} from './extent';


/**
 * @typedef {function((number|undefined), (import("./size.js").Size), boolean):
 *  (number|undefined)} Type
 */

const tmpExtent = createEmpty();

/**
 * @param {Array<number>} resolutions Resolutions.
 * @param {import("./extent.js").Extent=} opt_maxExtent Maximum allowed extent.
 * @return {Type} Zoom function.
 */
export function createSnapToResolutions(resolutions, opt_maxExtent) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean} whileInteracting Will be true if the constraint is applied
     * during an interaction.
     * @return {number|undefined} Resolution.
     */
    function(resolution, size, whileInteracting) {
      if (resolution !== undefined) {
        let cappedRes = resolution;

        // apply constraint related to max extent
        if (opt_maxExtent) {
          const xResolution = getWidth(opt_maxExtent) / size[0];
          const yResolution = getHeight(opt_maxExtent) / size[1];
          cappedRes = Math.min(cappedRes, Math.min(xResolution, yResolution));
        }

        // do not snap during interaction/animation
        if (whileInteracting) {
          return Math.min(resolution, cappedRes);
        }

        // todo: compute direction
        const z = linearFindNearest(resolutions, cappedRes, 0);
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
 * @param {number} zoomFactor Zoom factor (default: 2).
 * @param {number} maxResolution Maximum resolution.
 * @param {number=} opt_maxLevel Maximum level.
 * @param {import("./extent.js").Extent=} opt_maxExtent Maximum allowed extent.
 * @return {Type} Zoom function.
 */
export function createSnapToPower(zoomFactor, maxResolution, opt_maxLevel, opt_maxExtent) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean} whileInteracting Will be true if the constraint is applied
     * during an interaction.
     * @return {number|undefined} Resolution.
     */
    function(resolution, size, whileInteracting) {
      if (resolution !== undefined) {
        let cappedRes = resolution;

        // apply constraint related to max extent
        if (opt_maxExtent) {
          const xResolution = getWidth(opt_maxExtent) / size[0];
          const yResolution = getHeight(opt_maxExtent) / size[1];
          cappedRes = Math.min(cappedRes, Math.min(xResolution, yResolution));
        }

        // do not snap during interaction/animation
        if (whileInteracting) {
          return Math.min(resolution, cappedRes);
        }

        // todo: compute direction
        let newLevel = Math.round(
          Math.log(maxResolution / cappedRes) / Math.log(zoomFactor));
        if (opt_maxLevel !== undefined) {
          newLevel = Math.min(newLevel, opt_maxLevel);
        }
        return maxResolution / Math.pow(zoomFactor, newLevel);
      } else {
        return undefined;
      }
    });
}
