// FIXME add tests for browser features (Modernizr?)
// FIXME implement Matrix Filter for IE < 9

goog.provide('ol.dom');
goog.provide('ol.dom.BrowserFeature');

goog.require('goog.vec.Mat4');


/**
 * @enum {boolean}
 */
ol.dom.BrowserFeature = {
  CAN_USE_CSS_TRANSFORM: false,
  CAN_USE_CSS_TRANSFORM3D: true,
  CAN_USE_MATRIX_FILTER: false
};


/**
 * @param {Element} element Element.
 * @param {string} value Value.
 */
ol.dom.setTransform = function(element, value) {
  var style = element.style;
  style.WebkitTransform = value;
  style.MozTransform = value;
  style.OTransform = value;
  style.transform = value;
};


/**
 * @param {Element} element Element.
 * @param {goog.vec.Mat4.AnyType} transform Matrix.
 */
ol.dom.transformElement2D = function(element, transform) {
  // using matrix() causes gaps in Chrome and Firefox on Mac OS X, so prefer
  // matrix3d()
  if (ol.dom.BrowserFeature.CAN_USE_CSS_TRANSFORM3D) {
    ol.dom.setTransform(element, 'matrix3d(' + transform.join(',') + ')');
  } else if (ol.dom.BrowserFeature.CAN_USE_CSS_TRANSFORM) {
    ol.dom.setTransform(element, 'matrix(' +
        goog.vec.Mat4.getElement(transform, 0, 0) + ',' +
        goog.vec.Mat4.getElement(transform, 1, 0) + ',' +
        goog.vec.Mat4.getElement(transform, 0, 1) + ',' +
        goog.vec.Mat4.getElement(transform, 1, 1) + ',' +
        goog.vec.Mat4.getElement(transform, 0, 3) + ',' +
        goog.vec.Mat4.getElement(transform, 1, 3) + ')');
  } else if (ol.dom.BrowserFeature.CAN_USE_MATRIX_FILTER) {
    // http://msdn.microsoft.com/en-us/library/ms533014%28VS.85,loband%29.aspx
    goog.asserts.assert(false); // FIXME
  } else {
    // FIXME check this code!
    var style = element.style;
    style.left = Math.round(goog.vec.Mat4.getElement(transform, 0, 3)) + 'px';
    style.top = Math.round(goog.vec.Mat4.getElement(transform, 1, 3)) + 'px';
  }
};
