goog.provide('ol.BrowserFeature');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol.webgl');


/**
 * @define {boolean} Assume touch.
 */
ol.ASSUME_TOUCH = false;


/**
* The ratio between physical pixels and device-independent pixels
* (dips) on the device (`window.devicePixelRatio`).
* @const
* @type {number}
* @todo stability experimental
*/
ol.BrowserFeature.DEVICE_PIXEL_RATIO = goog.global.devicePixelRatio || 1;


/**
 * True if browser supports Canvas.
 * @const
 * @type {boolean}
 * @todo stability experimental
 */
ol.BrowserFeature.HAS_CANVAS = (
    /**
     * @return {boolean} Canvas supported.
     */
    function() {
      if (!('HTMLCanvasElement' in goog.global)) {
        return false;
      }
      try {
        var canvas = /** @type {HTMLCanvasElement} */
            (goog.dom.createElement(goog.dom.TagName.CANVAS));
        return !goog.isNull(canvas.getContext('2d'));
      } catch (e) {
        return false;
      }
    })();


/**
 * Indicates if DeviceOrientation is supported in the user's browser.
 * @const
 * @type {boolean}
 * @todo stability experimental
 */
ol.BrowserFeature.HAS_DEVICE_ORIENTATION =
    'DeviceOrientationEvent' in goog.global;


/**
 * Is HTML5 geolocation supported in the current browser?
 * @const
 * @type {boolean}
 * @todo stability experimental
 */
ol.BrowserFeature.HAS_GEOLOCATION = 'geolocation' in goog.global.navigator;


/**
* True if browser supports touch events.
* @const
* @type {boolean}
 * @todo stability experimental
*/
ol.BrowserFeature.HAS_TOUCH = ol.ASSUME_TOUCH ||
    (goog.global.document &&
    'ontouchstart' in goog.global.document.documentElement) ||
    !!(goog.global.navigator.msPointerEnabled);


/**
 * True if browser supports WebGL.
 * @const
 * @type {boolean}
 * @todo stability experimental
 */
ol.BrowserFeature.HAS_WEBGL = (
    /**
     * @return {boolean} WebGL supported.
     */
    function() {
      if (!('WebGLRenderingContext' in goog.global)) {
        return false;
      }
      try {
        var canvas = /** @type {HTMLCanvasElement} */
            (goog.dom.createElement(goog.dom.TagName.CANVAS));
        return !goog.isNull(ol.webgl.getContext(canvas, {
          failIfMajorPerformanceCaveat: true
        }));
      } catch (e) {
        return false;
      }
    })();
