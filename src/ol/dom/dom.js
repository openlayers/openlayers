// FIXME add tests for browser features (Modernizr?)

goog.provide('ol.dom');
goog.provide('ol.dom.BrowserFeature');

goog.require('goog.asserts');
goog.require('goog.vec.Mat4');


/**
 * @enum {boolean}
 */
ol.dom.BrowserFeature = {
  CAN_USE_CSS_TRANSFORM: false,
  CAN_USE_CSS_TRANSFORM3D: true
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
 * @param {number=} opt_precision Precision.
 */
ol.dom.transformElement2D = function(element, transform, opt_precision) {
  // using matrix() causes gaps in Chrome and Firefox on Mac OS X, so prefer
  // matrix3d()
  var i;
  if (ol.dom.BrowserFeature.CAN_USE_CSS_TRANSFORM3D) {
    var value3D;
    if (goog.isDef(opt_precision)) {
      /** @type {Array.<string>} */
      var strings3D = new Array(16);
      for (i = 0; i < 16; ++i) {
        strings3D[i] = transform[i].toFixed(opt_precision);
      }
      value3D = strings3D.join(',');
    } else {
      value3D = transform.join(',');
    }
    ol.dom.setTransform(element, 'matrix3d(' + value3D + ')');
  } else if (ol.dom.BrowserFeature.CAN_USE_CSS_TRANSFORM) {
    /** @type {Array.<number>} */
    var transform2D = [
      goog.vec.Mat4.getElement(transform, 0, 0),
      goog.vec.Mat4.getElement(transform, 1, 0),
      goog.vec.Mat4.getElement(transform, 0, 1),
      goog.vec.Mat4.getElement(transform, 1, 1),
      goog.vec.Mat4.getElement(transform, 0, 3),
      goog.vec.Mat4.getElement(transform, 1, 3)
    ];
    var value2D;
    if (goog.isDef(opt_precision)) {
      /** @type {Array.<string>} */
      var strings2D = new Array(6);
      for (i = 0; i < 6; ++i) {
        strings2D[i] = transform2D[i].toFixed(opt_precision);
      }
      value2D = strings2D.join(',');
    } else {
      value2D = transform2D.join(',');
    }
    ol.dom.setTransform(element, 'matrix(' + value2D + ')');
  } else {
    // FIXME check this code!
    var style = element.style;
    style.left = Math.round(goog.vec.Mat4.getElement(transform, 0, 3)) + 'px';
    style.top = Math.round(goog.vec.Mat4.getElement(transform, 1, 3)) + 'px';
  }
};
