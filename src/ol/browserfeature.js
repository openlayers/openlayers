goog.provide('ol.BrowserFeature');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('ol');
goog.require('ol.dom');
goog.require('ol.webgl');


/**
 * The ratio between physical pixels and device-independent pixels
 * (dips) on the device (`window.devicePixelRatio`).
 * @const
 * @type {number}
 * @api
 */
ol.BrowserFeature.DEVICE_PIXEL_RATIO = goog.global.devicePixelRatio || 1;


/**
 * True if the browser supports ArrayBuffers.
 * @const
 * @type {boolean}
 */
ol.BrowserFeature.HAS_ARRAY_BUFFER = 'ArrayBuffer' in goog.global;


/**
 * True if the browser's Canvas implementation implements {get,set}LineDash.
 * @type {boolean}
 */
ol.BrowserFeature.HAS_CANVAS_LINE_DASH = false;


/**
 * True if browser supports Canvas.
 * @const
 * @type {boolean}
 * @api
 */
ol.BrowserFeature.HAS_CANVAS = ol.ENABLE_CANVAS && (
    /**
     * @return {boolean} Canvas supported.
     */
    function() {
      if (!('HTMLCanvasElement' in goog.global)) {
        return false;
      }
      try {
        var context = ol.dom.createCanvasContext2D();
        if (goog.isNull(context)) {
          return false;
        } else {
          if (goog.isDef(context.setLineDash)) {
            ol.BrowserFeature.HAS_CANVAS_LINE_DASH = true;
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
ol.BrowserFeature.HAS_DEVICE_ORIENTATION =
    'DeviceOrientationEvent' in goog.global;


/**
 * True if browser supports DOM.
 * @const
 * @type {boolean}
 */
ol.BrowserFeature.HAS_DOM = ol.ENABLE_DOM;


/**
 * Is HTML5 geolocation supported in the current browser?
 * @const
 * @type {boolean}
 * @api
 */
ol.BrowserFeature.HAS_GEOLOCATION = 'geolocation' in goog.global.navigator;


/**
 * @const
 * @type {boolean}
 */
ol.BrowserFeature.HAS_JSON_PARSE =
    'JSON' in goog.global && 'parse' in goog.global.JSON;


/**
 * True if browser supports touch events.
 * @const
 * @type {boolean}
 * @api
 */
ol.BrowserFeature.HAS_TOUCH = ol.ASSUME_TOUCH || 'ontouchstart' in goog.global;


/**
 * True if browser supports pointer events.
 * @const
 * @type {boolean}
 */
ol.BrowserFeature.HAS_POINTER = 'PointerEvent' in goog.global;


/**
 * True if browser supports ms pointer events (IE 10).
 * @const
 * @type {boolean}
 */
ol.BrowserFeature.HAS_MSPOINTER =
    !!(goog.global.navigator.msPointerEnabled);


/**
 * True if browser supports WebGL.
 * @const
 * @type {boolean}
 * @api
 */
ol.BrowserFeature.HAS_WEBGL = ol.ENABLE_WEBGL && (
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
