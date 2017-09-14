goog.provide('ol.has');

goog.require('ol');
goog.require('ol.webgl');

var ua = typeof navigator !== 'undefined' ?
  navigator.userAgent.toLowerCase() : '';

/**
 * User agent string says we are dealing with Firefox as browser.
 * @type {boolean}
 */
ol.has.FIREFOX = ua.indexOf('firefox') !== -1;

/**
 * User agent string says we are dealing with Safari as browser.
 * @type {boolean}
 */
ol.has.SAFARI = ua.indexOf('safari') !== -1 && ua.indexOf('chrom') == -1;

/**
 * User agent string says we are dealing with a WebKit engine.
 * @type {boolean}
 */
ol.has.WEBKIT = ua.indexOf('webkit') !== -1 && ua.indexOf('edge') == -1;

/**
 * User agent string says we are dealing with a Mac as platform.
 * @type {boolean}
 */
ol.has.MAC = ua.indexOf('macintosh') !== -1;


/**
 * The ratio between physical pixels and device-independent pixels
 * (dips) on the device (`window.devicePixelRatio`).
 * @const
 * @type {number}
 * @api
 */
ol.has.DEVICE_PIXEL_RATIO = window.devicePixelRatio || 1;


/**
 * True if the browser's Canvas implementation implements {get,set}LineDash.
 * @type {boolean}
 */
ol.has.CANVAS_LINE_DASH = false;


/**
 * True if both the library and browser support Canvas.  Always `false`
 * if `ol.ENABLE_CANVAS` is set to `false` at compile time.
 * @const
 * @type {boolean}
 * @api
 */
ol.has.CANVAS = ol.ENABLE_CANVAS && (
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
          ol.has.CANVAS_LINE_DASH = true;
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
ol.has.DEVICE_ORIENTATION = 'DeviceOrientationEvent' in window;


/**
 * Is HTML5 geolocation supported in the current browser?
 * @const
 * @type {boolean}
 * @api
 */
ol.has.GEOLOCATION = 'geolocation' in navigator;


/**
 * True if browser supports touch events.
 * @const
 * @type {boolean}
 * @api
 */
ol.has.TOUCH = ol.ASSUME_TOUCH || 'ontouchstart' in window;


/**
 * True if browser supports pointer events.
 * @const
 * @type {boolean}
 */
ol.has.POINTER = 'PointerEvent' in window;


/**
 * True if browser supports ms pointer events (IE 10).
 * @const
 * @type {boolean}
 */
ol.has.MSPOINTER = !!(navigator.msPointerEnabled);


/**
 * True if both OpenLayers and browser support WebGL.  Always `false`
 * if `ol.ENABLE_WEBGL` is set to `false` at compile time.
 * @const
 * @type {boolean}
 * @api
 */
ol.has.WEBGL;


(function() {
  if (ol.ENABLE_WEBGL) {
    var hasWebGL = false;
    var textureSize;
    var /** @type {Array.<string>} */ extensions = [];

    if ('WebGLRenderingContext' in window) {
      try {
        var canvas = /** @type {HTMLCanvasElement} */
            (document.createElement('CANVAS'));
        var gl = ol.webgl.getContext(canvas, {
          failIfMajorPerformanceCaveat: true
        });
        if (gl) {
          hasWebGL = true;
          textureSize = /** @type {number} */
            (gl.getParameter(gl.MAX_TEXTURE_SIZE));
          extensions = gl.getSupportedExtensions();
        }
      } catch (e) {
        // pass
      }
    }
    ol.has.WEBGL = hasWebGL;
    ol.WEBGL_EXTENSIONS = extensions;
    ol.WEBGL_MAX_TEXTURE_SIZE = textureSize;
  }
})();
