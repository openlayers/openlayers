/**
 * @module ol/centerconstraint
 */
import {clamp} from './math.js';


/**
 * @param {ol.Extent} extent Extent.
 * @return {ol.CenterConstraintType} The constraint.
 */
export function createExtent(extent) {
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
}


/**
 * @param {ol.Coordinate|undefined} center Center.
 * @return {ol.Coordinate|undefined} Center.
 */
export function none(center) {
  return center;
}
