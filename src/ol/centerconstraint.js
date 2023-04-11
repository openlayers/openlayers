/**
 * @module ol/centerconstraint
 */
import {clamp} from './math.js';

/**
 * @typedef {function((import("./coordinate.js").Coordinate|undefined), number, import("./size.js").Size, boolean=, Array<number>=): (import("./coordinate.js").Coordinate|undefined)} Type
 */

/**
 * @param {import("./extent.js").Extent} extent Extent.
 * @param {boolean} onlyCenter If true, the constraint will only apply to the view center.
 * @param {boolean} smooth If true, the view will be able to go slightly out of the given extent
 * (only during interaction and animation).
 * @return {Type} The constraint.
 */
export function createExtent(extent, onlyCenter, smooth) {
  return (
    /**
     * @param {import("./coordinate.js").Coordinate|undefined} center Center.
     * @param {number|undefined} resolution Resolution.
     * @param {import("./size.js").Size} size Viewport size; unused if `onlyCenter` was specified.
     * @param {boolean} [isMoving] True if an interaction or animation is in progress.
     * @param {Array<number>} [centerShift] Shift between map center and viewport center.
     * @return {import("./coordinate.js").Coordinate|undefined} Center.
     */
    function (center, resolution, size, isMoving, centerShift) {
      if (!center) {
        return undefined;
      }
      if (!resolution && !onlyCenter) {
        return center;
      }
      const viewWidth = onlyCenter ? 0 : size[0] * resolution;
      const viewHeight = onlyCenter ? 0 : size[1] * resolution;
      const shiftX = centerShift ? centerShift[0] : 0;
      const shiftY = centerShift ? centerShift[1] : 0;
      let minX = extent[0] + viewWidth / 2 + shiftX;
      let maxX = extent[2] - viewWidth / 2 + shiftX;
      let minY = extent[1] + viewHeight / 2 + shiftY;
      let maxY = extent[3] - viewHeight / 2 + shiftY;

      // note: when zooming out of bounds, min and max values for x and y may
      // end up inverted (min > max); this has to be accounted for
      if (minX > maxX) {
        minX = (maxX + minX) / 2;
        maxX = minX;
      }
      if (minY > maxY) {
        minY = (maxY + minY) / 2;
        maxY = minY;
      }

      let x = clamp(center[0], minX, maxX);
      let y = clamp(center[1], minY, maxY);

      // during an interaction, allow some overscroll
      if (isMoving && smooth && resolution) {
        const ratio = 30 * resolution;
        x +=
          -ratio * Math.log(1 + Math.max(0, minX - center[0]) / ratio) +
          ratio * Math.log(1 + Math.max(0, center[0] - maxX) / ratio);
        y +=
          -ratio * Math.log(1 + Math.max(0, minY - center[1]) / ratio) +
          ratio * Math.log(1 + Math.max(0, center[1] - maxY) / ratio);
      }

      return [x, y];
    }
  );
}

/**
 * @param {import("./coordinate.js").Coordinate} [center] Center.
 * @return {import("./coordinate.js").Coordinate|undefined} Center.
 */
export function none(center) {
  return center;
}
