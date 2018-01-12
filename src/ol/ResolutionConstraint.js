/**
 * @module ol/ResolutionConstraint
 */
import {linearFindNearest} from './array.js';
import {clamp} from './math.js';
const ResolutionConstraint = {};


/**
 * @param {Array.<number>} resolutions Resolutions.
 * @return {ol.ResolutionConstraintType} Zoom function.
 */
ResolutionConstraint.createSnapToResolutions = function(resolutions) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} delta Delta.
     * @param {number} direction Direction.
     * @return {number|undefined} Resolution.
     */
    function(resolution, delta, direction) {
      if (resolution !== undefined) {
        let z = linearFindNearest(resolutions, resolution, direction);
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
};


/**
 * @param {number} power Power.
 * @param {number} maxResolution Maximum resolution.
 * @param {number=} opt_maxLevel Maximum level.
 * @return {ol.ResolutionConstraintType} Zoom function.
 */
ResolutionConstraint.createSnapToPower = function(power, maxResolution, opt_maxLevel) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} delta Delta.
     * @param {number} direction Direction.
     * @return {number|undefined} Resolution.
     */
    function(resolution, delta, direction) {
      if (resolution !== undefined) {
        const offset = -direction / 2 + 0.5;
        const oldLevel = Math.floor(
          Math.log(maxResolution / resolution) / Math.log(power) + offset);
        let newLevel = Math.max(oldLevel + delta, 0);
        if (opt_maxLevel !== undefined) {
          newLevel = Math.min(newLevel, opt_maxLevel);
        }
        return maxResolution / Math.pow(power, newLevel);
      } else {
        return undefined;
      }
    });
};
export default ResolutionConstraint;
