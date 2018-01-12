/**
 * @module ol/CenterConstraint
 */
import {clamp} from './math.js';
const CenterConstraint = {};


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.CenterConstraintType} The constraint.
 */
CenterConstraint.createExtent = function(extent) {
  return (
    /**
     * @param {ol.Coordinate|undefined} center Center.
     * @return {ol.Coordinate|undefined} Center.
     */
    function(center) {
      if (center) {
        return [
          clamp(center[0], extent[0], extent[2]),
          clamp(center[1], extent[1], extent[3])
        ];
      } else {
        return undefined;
      }
    }
  );
};


/**
 * @param {ol.Coordinate|undefined} center Center.
 * @return {ol.Coordinate|undefined} Center.
 */
CenterConstraint.none = function(center) {
  return center;
};
export default CenterConstraint;
