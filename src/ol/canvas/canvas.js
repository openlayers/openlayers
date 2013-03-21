goog.provide('ol.canvas');

goog.require('goog.dom');
goog.require('goog.dom.TagName');


/**
 * Is supported.
 * @const
 * @type {boolean}
 */
ol.canvas.SUPPORTED = (function() {
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
