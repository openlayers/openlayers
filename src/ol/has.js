/**
 * @module ol/has
 */

const ua =
  typeof navigator !== 'undefined' && typeof navigator.userAgent !== 'undefined'
    ? navigator.userAgent.toLowerCase()
    : '';

/**
 * User agent string says we are dealing with Safari as browser.
 * @type {boolean}
 */
export const SAFARI = ua.includes('safari') && !ua.includes('chrom');

/**
 * https://bugs.webkit.org/show_bug.cgi?id=237906
 * @type {boolean}
 */
export const SAFARI_BUG_237906 =
  SAFARI &&
  (ua.includes('version/15.4') ||
    /cpu (os|iphone os) 15_4 like mac os x/.test(ua));

/**
 * User agent string says we are dealing with a WebKit engine.
 * @type {boolean}
 */
export const WEBKIT = ua.includes('webkit') && !ua.includes('edge');

/**
 * User agent string says we are dealing with a Mac as platform.
 * @type {boolean}
 */
export const MAC = ua.includes('macintosh');

/**
 * The ratio between physical pixels and device-independent pixels
 * (dips) on the device (`window.devicePixelRatio`).
 * @const
 * @type {number}
 * @api
 */
export const DEVICE_PIXEL_RATIO =
  typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;

/**
 * The execution context is a worker with OffscreenCanvas available.
 * @const
 * @type {boolean}
 */
export const WORKER_OFFSCREEN_CANVAS =
  typeof WorkerGlobalScope !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  self instanceof WorkerGlobalScope; //eslint-disable-line

/**
 * Image.prototype.decode() is supported.
 * @type {boolean}
 */
export const IMAGE_DECODE =
  typeof Image !== 'undefined' && Image.prototype.decode;

/**
 * createImageBitmap() is supported.
 * @type {boolean}
 */
export const CREATE_IMAGE_BITMAP = typeof createImageBitmap === 'function';

/**
 * @type {boolean}
 */
export const PASSIVE_EVENT_LISTENERS = (function () {
  let passive = false;
  try {
    const options = Object.defineProperty({}, 'passive', {
      get: function () {
        passive = true;
      },
    });

    // @ts-ignore Ignore invalid event type '_'
    window.addEventListener('_', null, options);
    // @ts-ignore Ignore invalid event type '_'
    window.removeEventListener('_', null, options);
  } catch {
    // passive not supported
  }
  return passive;
})();
