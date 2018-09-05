/**
 * @module ol/centerconstraint
 */
import {clamp} from './math.js';


/**
 * @typedef {function((import("./coordinate.js").Coordinate|undefined)): (import("./coordinate.js").Coordinate|undefined)} Type
 */


/**
 * @param {import("./extent.js").Extent} extent Extent.
 * @return {Type} The constraint.
 */
export function createExtent(extent) {
  return (
    /**
     * @param {import("./coordinate.js").Coordinate=} center Center.
     * @return {import("./coordinate.js").Coordinate|undefined} Center.
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
 * @param {import("./coordinate.js").Coordinate=} center Center.
 * @return {import("./coordinate.js").Coordinate|undefined} Center.
 */
export function none(center) {
  return center;
}
