/**
 * @module ol/source/common
 */
import {FIREFOX, SAFARI, WEBKIT} from '../has.js';

/**
 * Default WMS version.
 * @type {string}
 */
export const DEFAULT_WMS_VERSION = '1.3.0';

/**
 * Context options to disable image smoothing.
 * @type {Object}
 */
export const IMAGE_SMOOTHING_DISABLED =
  FIREFOX || SAFARI || WEBKIT
    ? {imageSmoothingEnabled: false}
    : {
        imageSmoothingEnabled: false,
        msImageSmoothingEnabled: false,
      };
