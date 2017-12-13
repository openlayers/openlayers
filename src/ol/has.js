/**
 * @module ol/has
 */
import {HAS_WEBGL} from './index.js';

var _ol_has_ = {};

var ua = typeof navigator !== 'undefined' ?
  navigator.userAgent.toLowerCase() : '';

/**
 * User agent string says we are dealing with Firefox as browser.
 * @type {boolean}
 */
_ol_has_.FIREFOX = ua.indexOf('firefox') !== -1;

/**
 * User agent string says we are dealing with Safari as browser.
 * @type {boolean}
 */
_ol_has_.SAFARI = ua.indexOf('safari') !== -1 && ua.indexOf('chrom') == -1;

/**
 * User agent string says we are dealing with a WebKit engine.
 * @type {boolean}
 */
_ol_has_.WEBKIT = ua.indexOf('webkit') !== -1 && ua.indexOf('edge') == -1;

/**
 * User agent string says we are dealing with a Mac as platform.
 * @type {boolean}
 */
_ol_has_.MAC = ua.indexOf('macintosh') !== -1;


/**
 * The ratio between physical pixels and device-independent pixels
 * (dips) on the device (`window.devicePixelRatio`).
 * @const
 * @type {number}
 * @api
 */
_ol_has_.DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;


/**
 * True if the browser's Canvas implementation implements {get,set}LineDash.
 * @type {boolean}
 */
_ol_has_.CANVAS_LINE_DASH = false;


/**
 * True if the and browsers support Canvas.
 * @const
 * @type {boolean}
 * @api
 */
_ol_has_.CANVAS = (
  /**
   * @return {boolean} Canvas supported.
   */
  function() {
    if (!('HTMLCanvasElement' in window)) {
      return false;
    }
    try {
      var context = document.createElement('CANVAS').getContext('2d');
      if (!context) {
        return false;
      } else {
        if (context.setLineDash !== undefined) {
          _ol_has_.CANVAS_LINE_DASH = true;
        }
        return true;
      }
    } catch (e) {
      return false;
    }
  })();


/**
 * Indicates if DeviceOrientation is supported in the user's browser.
 * @const
 * @type {boolean}
 * @api
 */
_ol_has_.DEVICE_ORIENTATION = 'DeviceOrientationEvent' in window;


/**
 * Is HTML5 geolocation supported in the current browser?
 * @const
 * @type {boolean}
 * @api
 */
_ol_has_.GEOLOCATION = 'geolocation' in navigator;


/**
 * True if browser supports touch events.
 * @const
 * @type {boolean}
 * @api
 */
_ol_has_.TOUCH = 'ontouchstart' in window;


/**
 * True if browser supports pointer events.
 * @const
 * @type {boolean}
 */
_ol_has_.POINTER = 'PointerEvent' in window;


/**
 * True if browser supports ms pointer events (IE 10).
 * @const
 * @type {boolean}
 */
_ol_has_.MSPOINTER = !!(navigator.msPointerEnabled);


/**
 * True if both OpenLayers and browser support WebGL.
 * @const
 * @type {boolean}
 * @api
 */
_ol_has_.WEBGL = HAS_WEBGL;


export default _ol_has_;
