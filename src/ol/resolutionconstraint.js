/**
 * @module ol/resolutionconstraint
 */
import {clamp} from './math.js';
import {getHeight, getWidth} from './extent.js';
import {linearFindNearest} from './array.js';

/**
 * @typedef {function((number|undefined), number, import("./size.js").Size, boolean=): (number|undefined)} Type
 */

/**
 * Returns a modified resolution taking into account the viewport size and maximum
 * allowed extent.
 * @param {number} resolution Resolution
 * @param {import("./extent.js").Extent} maxExtent Maximum allowed extent.
 * @param {import("./size.js").Size} viewportSize Viewport size.
 * @param {boolean} showFullExtent Whether to show the full extent.
 * @return {number} Capped resolution.
 */
function getViewportClampedResolution(
  resolution,
  maxExtent,
  viewportSize,
  showFullExtent
) {
  const xResolution = getWidth(maxExtent) / viewportSize[0];
  const yResolution = getHeight(maxExtent) / viewportSize[1];

  if (showFullExtent) {
    return Math.min(resolution, Math.max(xResolution, yResolution));
  }
  return Math.min(resolution, Math.min(xResolution, yResolution));
}

/**
 * Returns a modified resolution to be between maxResolution and minResolution while
 * still allowing the value to be slightly out of bounds.
 * Note: the computation is based on the logarithm function (ln):
 *  - at 1, ln(x) is 0
 *  - above 1, ln(x) keeps increasing but at a much slower pace than x
 * The final result is clamped to prevent getting too far away from bounds.
 * @param {number} resolution Resolution.
 * @param {number} maxResolution Max resolution.
 * @param {number} minResolution Min resolution.
 * @return {number} Smoothed resolution.
 */
function getSmoothClampedResolution(resolution, maxResolution, minResolution) {
  let result = Math.min(resolution, maxResolution);
  const ratio = 50;

  result *=
    Math.log(1 + ratio * Math.max(0, resolution / maxResolution - 1)) / ratio +
    1;
  if (minResolution) {
    result = Math.max(result, minResolution);
    result /=
      Math.log(1 + ratio * Math.max(0, minResolution / resolution - 1)) /
        ratio +
      1;
  }
  return clamp(result, minResolution / 2, maxResolution * 2);
}

/**
 * @param {Array<number>} resolutions Resolutions.
 * @param {boolean} [smooth] If true, the view will be able to slightly exceed resolution limits. Default: true.
 * @param {import("./extent.js").Extent} [maxExtent] Maximum allowed extent.
 * @param {boolean} [showFullExtent] If true, allows us to show the full extent. Default: false.
 * @return {Type} Zoom function.
 */
export function createSnapToResolutions(
  resolutions,
  smooth,
  maxExtent,
  showFullExtent
) {
  smooth = smooth !== undefined ? smooth : true;
  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} direction Direction.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean} [isMoving] True if an interaction or animation is in progress.
     * @return {number|undefined} Resolution.
     */
    function (resolution, direction, size, isMoving) {
      if (resolution !== undefined) {
        const maxResolution = resolutions[0];
        const minResolution = resolutions[resolutions.length - 1];
        const cappedMaxRes = maxExtent
          ? getViewportClampedResolution(
              maxResolution,
              maxExtent,
              size,
              showFullExtent
            )
          : maxResolution;

        // during interacting or animating, allow intermediary values
        if (isMoving) {
          if (!smooth) {
            return clamp(resolution, minResolution, cappedMaxRes);
          }
          return getSmoothClampedResolution(
            resolution,
            cappedMaxRes,
            minResolution
          );
        }

        const capped = Math.min(cappedMaxRes, resolution);
        const z = Math.floor(linearFindNearest(resolutions, capped, direction));
        if (resolutions[z] > cappedMaxRes && z < resolutions.length - 1) {
          return resolutions[z + 1];
        }
        return resolutions[z];
      } else {
        return undefined;
      }
    }
  );
}

/**
 * @param {number} power Power.
 * @param {number} maxResolution Maximum resolution.
 * @param {number} [minResolution] Minimum resolution.
 * @param {boolean} [smooth] If true, the view will be able to slightly exceed resolution limits. Default: true.
 * @param {import("./extent.js").Extent} [maxExtent] Maximum allowed extent.
 * @param {boolean} [showFullExtent] If true, allows us to show the full extent. Default: false.
 * @return {Type} Zoom function.
 */
export function createSnapToPower(
  power,
  maxResolution,
  minResolution,
  smooth,
  maxExtent,
  showFullExtent
) {
  smooth = smooth !== undefined ? smooth : true;
  minResolution = minResolution !== undefined ? minResolution : 0;

  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} direction Direction.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean} [isMoving] True if an interaction or animation is in progress.
     * @return {number|undefined} Resolution.
     */
    function (resolution, direction, size, isMoving) {
      if (resolution !== undefined) {
        const cappedMaxRes = maxExtent
          ? getViewportClampedResolution(
              maxResolution,
              maxExtent,
              size,
              showFullExtent
            )
          : maxResolution;

        // during interacting or animating, allow intermediary values
        if (isMoving) {
          if (!smooth) {
            return clamp(resolution, minResolution, cappedMaxRes);
          }
          return getSmoothClampedResolution(
            resolution,
            cappedMaxRes,
            minResolution
          );
        }

        const tolerance = 1e-9;
        const minZoomLevel = Math.ceil(
          Math.log(maxResolution / cappedMaxRes) / Math.log(power) - tolerance
        );
        const offset = -direction * (0.5 - tolerance) + 0.5;
        const capped = Math.min(cappedMaxRes, resolution);
        const cappedZoomLevel = Math.floor(
          Math.log(maxResolution / capped) / Math.log(power) + offset
        );
        const zoomLevel = Math.max(minZoomLevel, cappedZoomLevel);
        const newResolution = maxResolution / Math.pow(power, zoomLevel);
        return clamp(newResolution, minResolution, cappedMaxRes);
      } else {
        return undefined;
      }
    }
  );
}

/**
 * @param {number} maxResolution Max resolution.
 * @param {number} minResolution Min resolution.
 * @param {boolean} [smooth] If true, the view will be able to slightly exceed resolution limits. Default: true.
 * @param {import("./extent.js").Extent} [maxExtent] Maximum allowed extent.
 * @param {boolean} [showFullExtent] If true, allows us to show the full extent. Default: false.
 * @return {Type} Zoom function.
 */
export function createMinMaxResolution(
  maxResolution,
  minResolution,
  smooth,
  maxExtent,
  showFullExtent
) {
  smooth = smooth !== undefined ? smooth : true;

  return (
    /**
     * @param {number|undefined} resolution Resolution.
     * @param {number} direction Direction.
     * @param {import("./size.js").Size} size Viewport size.
     * @param {boolean} [isMoving] True if an interaction or animation is in progress.
     * @return {number|undefined} Resolution.
     */
    function (resolution, direction, size, isMoving) {
      if (resolution !== undefined) {
        const cappedMaxRes = maxExtent
          ? getViewportClampedResolution(
              maxResolution,
              maxExtent,
              size,
              showFullExtent
            )
          : maxResolution;

        if (!smooth || !isMoving) {
          return clamp(resolution, minResolution, cappedMaxRes);
        }
        return getSmoothClampedResolution(
          resolution,
          cappedMaxRes,
          minResolution
        );
      } else {
        return undefined;
      }
    }
  );
}
