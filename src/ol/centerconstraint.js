/**
 * @module ol/centerconstraint
 */
import {clamp} from './math.js';


/**
 * @typedef {function((import("./coordinate.js").Coordinate|undefined), number, import("./size.js").Size, boolean=): (import("./coordinate.js").Coordinate|undefined)} Type
 */


/**
 * @param {import("./extent.js").Extent} extent Extent.
 * @param {boolean} onlyCenter If true, the constraint will only apply to the view center.
 * @return {Type} The constraint.
 */
export function createExtent(extent, onlyCenter) {
  return (
    /**
     * @param {import("./coordinate.js").Coordinate|undefined} center Center.
     * @param {number} resolution Resolution.
     * @param {import("./size.js").Size} size Viewport size; unused if `onlyCenter` was specified.
     * @param {boolean=} opt_isMoving True if an interaction or animation is in progress.
     * @return {import("./coordinate.js").Coordinate|undefined} Center.
     */
    function(center, resolution, size, opt_isMoving) {
      if (center) {
        let viewWidth = onlyCenter ? 0 : size[0] * resolution;
        let viewHeight = onlyCenter ? 0 : size[1] * resolution;

        return [
          clamp(center[0], extent[0] + viewWidth / 2, extent[2] - viewWidth / 2),
          clamp(center[1], extent[1] + viewHeight / 2, extent[3] - viewHeight / 2)
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
