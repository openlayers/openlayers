goog.provide('ol.ResolutionConstraint');

goog.require('ol.array');
goog.require('ol.math');


/**
 * @param {Array.<number>} resolutions Resolutions.
 * @return {ol.ResolutionConstraintType} Zoom function.
 */
ol.ResolutionConstraint.createSnapToResolutions = function(resolutions) {
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
              ol.array.linearFindNearest(resolutions, resolution, direction);
          z = ol.math.clamp(z + delta, 0, resolutions.length - 1);
          return resolutions[z];
        } else {
          return undefined;
        }
      });
};


/**
 * @param {number} power Power.
 * @param {number} maxResolution Maximum resolution.
 * @param {number=} opt_maxLevel Maximum level.
 * @return {ol.ResolutionConstraintType} Zoom function.
 */
ol.ResolutionConstraint.createSnapToPower = function(power, maxResolution, opt_maxLevel) {
  return (
      /**
       * @param {number|undefined} resolution Resolution.
       * @param {number} delta Delta.
       * @param {number} direction Direction.
       * @return {number|undefined} Resolution.
       */
      function(resolution, delta, direction) {
        if (resolution !== undefined) {
          var offset;
          if (direction > 0) {
            offset = 0;
          } else if (direction < 0) {
            offset = 1;
          } else {
            offset = 0.5;
          }
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
