goog.provide('ol.BrowserFeature');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.userAgent');
goog.require('ol.webgl');


/**
 * @define {boolean} Assume touch.
 */
ol.ASSUME_TOUCH = false;


/**
 * @define {boolean} Whether to enable canvas.
 */
ol.ENABLE_CANVAS = true;


/**
 * @define {boolean} Whether to enable DOM.
 */
ol.ENABLE_DOM = true;


/**
 * @define {boolean} Whether to enable rendering of image layers.
 */
ol.ENABLE_IMAGE = true;


/**
 * @define {boolean} Whether to enable rendering of tile layers.
 */
ol.ENABLE_TILE = true;


/**
 * @define {boolean} Whether to enable rendering of vector layers.
 */
ol.ENABLE_VECTOR = true;


/**
 * @define {boolean} Whether to enable WebGL.
 */
ol.ENABLE_WEBGL = true;


/**
 * @define {boolean} Whether to support legacy IE (7-8).
 */
ol.LEGACY_IE_SUPPORT = false;


/**
 * Whether the current browser is legacy IE
 * @const
 * @type {boolean}
 */
ol.IS_LEGACY_IE = goog.userAgent.IE &&
    !goog.userAgent.isVersionOrHigher('9.0') && goog.userAgent.VERSION !== '';


/**
 * The ratio between physical pixels and device-independent pixels
 * (dips) on the device (`window.devicePixelRatio`).
 * @const
 * @type {number}
 * @todo stability experimental
 */
ol.BrowserFeature.DEVICE_PIXEL_RATIO = goog.global.devicePixelRatio || 1;


/**
 * True if the browser's Canvas implementation implements {get,set}LineDash.
 * @type {boolean}
 * @todo stability experimental
 */
ol.BrowserFeature.HAS_CANVAS_LINE_DASH = false;


/**
 * True if browser supports Canvas.
 * @const
 * @type {boolean}
 * @todo stability experimental
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
        var canvas = /** @type {HTMLCanvasElement} */
            (goog.dom.createElement(goog.dom.TagName.CANVAS));
        var context = /** @type {CanvasRenderingContext2D} */
            (canvas.getContext('2d'));
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
 * @todo stability experimental
 */
ol.BrowserFeature.HAS_DEVICE_ORIENTATION =
    'DeviceOrientationEvent' in goog.global;


/**
 * True if browser supports DOM.
 * @const
 * @type {boolean}
 * @todo stability experimental
 */
ol.BrowserFeature.HAS_DOM = ol.ENABLE_DOM;


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
