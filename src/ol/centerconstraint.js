/**
 * @module ol/centerconstraint
 */
import {clamp} from './math.js';


/**
 * @typedef {function((module:ol/coordinate~Coordinate|undefined)): (module:ol/coordinate~Coordinate|undefined)} Type
 */


/**
 * @param {module:ol/extent~Extent} extent Extent.
 * @return {module:ol/centerconstraint~Type} The constraint.
 */
export function createExtent(extent) {
  return (
    /**
     * @param {module:ol/coordinate~Coordinate=} center Center.
     * @return {module:ol/coordinate~Coordinate|undefined} Center.
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
 * @param {module:ol/coordinate~Coordinate=} center Center.
 * @return {module:ol/coordinate~Coordinate|undefined} Center.
 */
export function none(center) {
  return center;
}
