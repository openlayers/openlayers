goog.provide('ol.canvas');

goog.require('goog.dom');
goog.require('goog.dom.TagName');


/**
 * @return {boolean} Is supported.
 */
ol.canvas.isSupported = function() {
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
};
