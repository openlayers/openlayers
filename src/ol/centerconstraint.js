/**
 * @module ol/centerconstraint
 */
import {clamp} from './math.js';
import {createEmpty, getForViewAndSize, getHeight, getWidth} from './extent';


/**
 * @typedef {function((import("./coordinate.js").Coordinate|undefined),number,number,(import("./size.js").Size),boolean):
 *  (import("./coordinate.js").Coordinate|undefined)} Type
 */

const tmpExtent = createEmpty();


/**
 * @param {import("./extent.js").Extent} extent Extent.
 * @return {Type} The constraint.
 */
export function createExtent(extent) {
  return (
    /**
     * @param {import("./coordinate.js").Coordinate=} center Center.
     * @param {number} resolution Resolution.
     * @param {number} rotation Rotation.
     * @param {import("./size.js").Size=} size Viewport size. If undefined, constrain only center.
     * @param {boolean} whileInteracting Will be true if the constraint is applied
     * during an interaction.
     * @return {import("./coordinate.js").Coordinate|undefined} Center.
     */
    function(center, resolution, rotation, size, whileInteracting) {
      if (center) {
        let viewWidth = 0;
        let viewHeight = 0;
        if (size) {
          const viewExtent = getForViewAndSize(center, resolution, rotation, size, tmpExtent);
          viewWidth = getWidth(viewExtent);
          viewHeight = getHeight(viewExtent);
        }

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
