/**
 * @module ol/has
 */
import {HAS_WEBGL} from './index.js';

const ua = typeof navigator !== 'undefined' ?
  navigator.userAgent.toLowerCase() : '';

/**
 * User agent string says we are dealing with Firefox as browser.
 * @type {boolean}
 */
export const FIREFOX = ua.indexOf('firefox') !== -1;

/**
 * User agent string says we are dealing with Safari as browser.
 * @type {boolean}
 */
export const SAFARI = ua.indexOf('safari') !== -1 && ua.indexOf('chrom') == -1;

/**
 * User agent string says we are dealing with a WebKit engine.
 * @type {boolean}
 */
export const WEBKIT = ua.indexOf('webkit') !== -1 && ua.indexOf('edge') == -1;

/**
 * User agent string says we are dealing with a Mac as platform.
 * @type {boolean}
 */
export const MAC = ua.indexOf('macintosh') !== -1;


/**
 * The ratio between physical pixels and device-independent pixels
 * (dips) on the device (`window.devicePixelRatio`).
 * @const
 * @type {number}
 * @api
 */
export const DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;


/**
 * True if the browser's Canvas implementation implements {get,set}LineDash.
 * @type {boolean}
 */
export const CANVAS_LINE_DASH = function() {
  let has = false;
  try {
    has = !!document.createElement('CANVAS').getContext('2d').setLineDash;
  } catch (e) {
    // pass
  }
  return has;
}();


/**
 * Is HTML5 geolocation supported in the current browser?
 * @const
 * @type {boolean}
 * @api
 */
export const GEOLOCATION = 'geolocation' in navigator;


/**
 * Is the client's processor has a little-endian architecture?
 * @const
 * @type {boolean|undefined}
 * @api
 */
export const LITTLE_ENDIAN = (
  /**
   * @return {boolean|undefined} Little endian or could not identify.
   */
  function() {
    if ('ArrayBuffer' in window) {
      var buffer = new window.ArrayBuffer(4);
      var data = new window.Uint32Array(buffer);
      var view = new window.Uint8Array(buffer);

      data[0] = 0x12345678;
      return view[0] === 0x78;
    } else {
      return undefined;
    }
  })();


/**
 * True if browser supports touch events.
 * @const
 * @type {boolean}
 * @api
 */
export const TOUCH = 'ontouchstart' in window;


/**
 * True if browser supports pointer events.
 * @const
 * @type {boolean}
 */
export const POINTER = 'PointerEvent' in window;


/**
 * True if browser supports ms pointer events (IE 10).
 * @const
 * @type {boolean}
 */
export const MSPOINTER = !!(navigator.msPointerEnabled);


/**
 * True if browser supports typed arrays, therefore rasters.
 * @const
 * @type {boolean}
 */
export const TYPED_ARRAY = 'ArrayBuffer' in window;

/**
 * True if both OpenLayers and browser support WebGL.
 * @const
 * @type {boolean}
 * @api
 */
export const WEBGL = HAS_WEBGL;
