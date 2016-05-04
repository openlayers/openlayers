goog.provide('ol.CenterConstraint');

goog.require('ol.math');


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.CenterConstraintType} The constraint.
 */
ol.CenterConstraint.createExtent = function(extent) {
  return (
      /**
       * @param {ol.Coordinate|undefined} center Center.
       * @return {ol.Coordinate|undefined} Center.
       */
      function(center) {
        if (center) {
          return [
            ol.math.clamp(center[0], extent[0], extent[2]),
            ol.math.clamp(center[1], extent[1], extent[3])
          ];
        } else {
          return undefined;
        }
      });
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 * @return {ol.Coordinate|undefined} Center.
 */
ol.CenterConstraint.none = function(center) {
  return center;
};
