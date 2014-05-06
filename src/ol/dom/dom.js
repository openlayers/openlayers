// FIXME add tests for browser features (Modernizr?)

goog.provide('ol.dom');
goog.provide('ol.dom.BrowserFeature');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.style');
goog.require('goog.userAgent');
goog.require('goog.vec.Mat4');
goog.require('ol');


/**
 * Create an html canvas element and returns its 2d context.
 * @param {number=} opt_width Canvas width.
 * @param {number=} opt_height Canvas height.
 * @return {CanvasRenderingContext2D}
 */
ol.dom.createCanvasContext2D = function(opt_width, opt_height) {
  var canvas = goog.dom.createElement(goog.dom.TagName.CANVAS);
  if (goog.isDef(opt_width)) {
    canvas.width = opt_width;
  }
  if (goog.isDef(opt_height)) {
    canvas.height = opt_height;
  }
  return canvas.getContext('2d');
};


/**
 * @enum {boolean}
 */
ol.dom.BrowserFeature = {
  USE_MS_MATRIX_TRANSFORM: ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE,
  USE_MS_ALPHA_FILTER: ol.LEGACY_IE_SUPPORT && ol.IS_LEGACY_IE
};


/**
 * Detect 2d transform.
 * Adapted from http://stackoverflow.com/q/5661671/130442
 * http://caniuse.com/#feat=transforms2d
 * @return {boolean}
 */
ol.dom.canUseCssTransform = (function() {
  var canUseCssTransform;
  return function() {
    if (!goog.isDef(canUseCssTransform)) {
      goog.asserts.assert(!goog.isNull(document.body));
      if (!goog.global.getComputedStyle) {
        // this browser is ancient
        canUseCssTransform = false;
      } else {
        var el = goog.dom.createElement(goog.dom.TagName.P),
            has2d,
            transforms = {
              'webkitTransform': '-webkit-transform',
              'OTransform': '-o-transform',
              'msTransform': '-ms-transform',
              'MozTransform': '-moz-transform',
              'transform': 'transform'
            };
        goog.dom.appendChild(document.body, el);
        for (var t in transforms) {
          if (t in el.style) {
            el.style[t] = 'translate(1px,1px)';
            has2d = goog.global.getComputedStyle(el).getPropertyValue(
                transforms[t]);
          }
        }
        goog.dom.removeNode(el);

        canUseCssTransform = (has2d && has2d !== 'none');
      }
    }
    return canUseCssTransform;
  };
}());


/**
 * Detect 3d transform.
 * Adapted from http://stackoverflow.com/q/5661671/130442
 * http://caniuse.com/#feat=transforms3d
 * @return {boolean}
 */
ol.dom.canUseCssTransform3D = (function() {
  var canUseCssTransform3D;
  return function() {
    if (!goog.isDef(canUseCssTransform3D)) {
      goog.asserts.assert(!goog.isNull(document.body));
      if (!goog.global.getComputedStyle) {
        // this browser is ancient
        canUseCssTransform3D = false;
      } else {
        var el = goog.dom.createElement(goog.dom.TagName.P),
            has3d,
            transforms = {
              'webkitTransform': '-webkit-transform',
              'OTransform': '-o-transform',
              'msTransform': '-ms-transform',
              'MozTransform': '-moz-transform',
              'transform': 'transform'
            };
        goog.dom.appendChild(document.body, el);
        for (var t in transforms) {
          if (t in el.style) {
            el.style[t] = 'translate3d(1px,1px,1px)';
            has3d = goog.global.getComputedStyle(el).getPropertyValue(
                transforms[t]);
          }
        }
        goog.dom.removeNode(el);

        canUseCssTransform3D = (has3d && has3d !== 'none');
      }
    }
    return canUseCssTransform3D;
  };
}());


/**
 * @param {Element} element Element.
 * @param {string} value Value.
 */
ol.dom.setTransform = function(element, value) {
  var style = element.style;
  style.WebkitTransform = value;
  style.MozTransform = value;
  style.OTransform = value;
  style.msTransform = value;
  style.transform = value;

  // IE 9+ seems to assume transform-origin: 100% 100%; for some unknown reason
  if (goog.userAgent.IE && !ol.IS_LEGACY_IE) {
    element.style.transformOrigin = '0 0';
  }
};


/**
 * Sets the opacity of an element, in an IE-compatible way
 * @param {!Element} element Element
 * @param {number} value Opacity, [0..1]
 */
ol.dom.setOpacity = function(element, value) {
  if (ol.dom.BrowserFeature.USE_MS_ALPHA_FILTER) {
    /** @type {string} */
    var filter = element.currentStyle.filter;

    /** @type {RegExp} */
    var regex;

    /** @type {string} */
    var alpha;

    if (goog.userAgent.VERSION == '8.0') {
      regex = /progid:DXImageTransform\.Microsoft\.Alpha\(.*?\)/i,
      alpha = 'progid:DXImageTransform.Microsoft.Alpha(Opacity=' +
          (value * 100) + ')';
    } else {
      regex = /alpha\(.*?\)/i;
      alpha = 'alpha(opacity=' + (value * 100) + ')';
    }

    var newFilter = filter.replace(regex, alpha);
    if (newFilter === filter) {
      // no replace was made? just append the new alpha filter instead
      newFilter += ' ' + alpha;
    }

    element.style.filter = newFilter;

    // Fix to apply filter to absolutely-positioned children element
    if (element.currentStyle.zIndex === 'auto') {
      element.style.zIndex = 0;
    }
  } else {
    goog.style.setOpacity(element, value);
  }
};


/**
 * Sets the IE matrix transform without replacing other filters
 * @private
 * @param {!Element} element Element
 * @param {string} value The new progid string
 */
ol.dom.setIEMatrix_ = function(element, value) {
  var filter = element.currentStyle.filter;
  var newFilter =
      filter.replace(/progid:DXImageTransform.Microsoft.Matrix\(.*?\)/i, value);

  if (newFilter === filter) {
    newFilter = ' ' + value;
  }

  element.style.filter = newFilter;

  // Fix to apply filter to absolutely-positioned children element
  if (element.currentStyle.zIndex === 'auto') {
    element.style.zIndex = 0;
  }
};


/**
 * @param {!Element} element Element.
 * @param {goog.vec.Mat4.Number} transform Matrix.
 * @param {number=} opt_precision Precision.
 * @param {Element=} opt_translationElement Required for IE7-8
 */
ol.dom.transformElement2D =
    function(element, transform, opt_precision, opt_translationElement) {
  // using matrix() causes gaps in Chrome and Firefox on Mac OS X, so prefer
  // matrix3d()
  var i;
  if (ol.dom.canUseCssTransform3D()) {
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
  } else if (ol.dom.canUseCssTransform()) {
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
  } else if (ol.dom.BrowserFeature.USE_MS_MATRIX_TRANSFORM) {
    var m11 = goog.vec.Mat4.getElement(transform, 0, 0),
        m12 = goog.vec.Mat4.getElement(transform, 0, 1),
        m21 = goog.vec.Mat4.getElement(transform, 1, 0),
        m22 = goog.vec.Mat4.getElement(transform, 1, 1),
        dx = goog.vec.Mat4.getElement(transform, 0, 3),
        dy = goog.vec.Mat4.getElement(transform, 1, 3);

    // See: http://msdn.microsoft.com/en-us/library/ms533014(v=vs.85).aspx
    // and: http://extremelysatisfactorytotalitarianism.com/blog/?p=1002
    // @TODO: fix terrible IE bbox rotation issue.
    var s = 'progid:DXImageTransform.Microsoft.Matrix(';
    s += 'sizingMethod="auto expand"';
    s += ',M11=' + m11.toFixed(opt_precision || 20);
    s += ',M12=' + m12.toFixed(opt_precision || 20);
    s += ',M21=' + m21.toFixed(opt_precision || 20);
    s += ',M22=' + m22.toFixed(opt_precision || 20);
    s += ')';
    ol.dom.setIEMatrix_(element, s);

    // scale = m11 = m22 = target resolution [m/px] / current res [m/px]
    // dx = (viewport width [px] / 2) * scale
    //      + (layer.x [m] - view.x [m]) / target resolution [m / px]
    // except that we're positioning the child element relative to the
    // viewport, not the map.
    // dividing by the scale factor isn't the exact correction, but it's
    // close enough that you can barely tell unless you're looking for it
    dx /= m11;
    dy /= m22;

    opt_translationElement.style.left = Math.round(dx) + 'px';
    opt_translationElement.style.top = Math.round(dy) + 'px';
  } else {
    element.style.left =
        Math.round(goog.vec.Mat4.getElement(transform, 0, 3)) + 'px';
    element.style.top =
        Math.round(goog.vec.Mat4.getElement(transform, 1, 3)) + 'px';

    // TODO: Add scaling here. This isn't quite as simple as multiplying
    // width/height, because that only changes the container size, not the
    // content size.
  }
};
