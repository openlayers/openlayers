import _ol_array_ from './array';
import _ol_math_ from './math';
var _ol_ResolutionConstraint_ = {};


/**
 * @param {Array.<number>} resolutions Resolutions.
 * @return {ol.ResolutionConstraintType} Zoom function.
 */
_ol_ResolutionConstraint_.createSnapToResolutions = function(resolutions) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} delta Delta.
     * @param {number} direction Direction.
     * @return {number|undefined} Resolution.
     */
    function(resolution, delta, direction) {
      if (resolution !== undefined) {
        var z =
              _ol_array_.linearFindNearest(resolutions, resolution, direction);
        z = _ol_math_.clamp(z + delta, 0, resolutions.length - 1);
        var index = Math.floor(z);
        if (z != index && index < resolutions.length - 1) {
          var power = resolutions[index] / resolutions[index + 1];
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
_ol_ResolutionConstraint_.createSnapToPower = function(power, maxResolution, opt_maxLevel) {
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} delta Delta.
     * @param {number} direction Direction.
     * @return {number|undefined} Resolution.
     */
    function(resolution, delta, direction) {
      if (resolution !== undefined) {
        var offset = -direction / 2 + 0.5;
        var oldLevel = Math.floor(
            Math.log(maxResolution / resolution) / Math.log(power) + offset);
        var newLevel = Math.max(oldLevel + delta, 0);
        if (opt_maxLevel !== undefined) {
          newLevel = Math.min(newLevel, opt_maxLevel);
        }
        return maxResolution / Math.pow(power, newLevel);
      } else {
        return undefined;
      }
    });
};
export default _ol_ResolutionConstraint_;
