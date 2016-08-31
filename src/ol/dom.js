goog.provide('ol.dom');

goog.require('ol');
goog.require('ol.has');
goog.require('ol.vec.Mat4');


/**
 * @type {Array.<number>}
 * @private
 */
ol.dom.tmpMat4_ = ol.vec.Mat4.create();


/**
 * Create an html canvas element and returns its 2d context.
 * @param {number=} opt_width Canvas width.
 * @param {number=} opt_height Canvas height.
 * @return {CanvasRenderingContext2D} The context.
 */
ol.dom.createCanvasContext2D = function(opt_width, opt_height) {
  var canvas = document.createElement('CANVAS');
  if (opt_width) {
    canvas.width = opt_width;
  }
  if (opt_height) {
    canvas.height = opt_height;
  }
  return canvas.getContext('2d');
};


/**
 * Detect 2d transform.
 * Adapted from http://stackoverflow.com/q/5661671/130442
 * http://caniuse.com/#feat=transforms2d
 * @return {boolean}
 */
ol.dom.canUseCssTransform = (function() {
  var global = ol.global;
  var canUseCssTransform;
  return function() {
    if (canUseCssTransform === undefined) {
      var el = document.createElement('P'),
          has2d,
          transforms = {
            'webkitTransform': '-webkit-transform',
            'OTransform': '-o-transform',
            'msTransform': '-ms-transform',
            'MozTransform': '-moz-transform',
            'transform': 'transform'
          };
      document.body.appendChild(el);
      for (var t in transforms) {
        if (t in el.style) {
          el.style[t] = 'translate(1px,1px)';
          has2d = global.getComputedStyle(el).getPropertyValue(
              transforms[t]);
        }
      }
      document.body.removeChild(el);

      canUseCssTransform = (has2d && has2d !== 'none');
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
  var global = ol.global;
  var canUseCssTransform3D;
  return function() {
    if (canUseCssTransform3D === undefined) {
      var el = document.createElement('P'),
          has3d,
          transforms = {
            'webkitTransform': '-webkit-transform',
            'OTransform': '-o-transform',
            'msTransform': '-ms-transform',
            'MozTransform': '-moz-transform',
            'transform': 'transform'
          };
      document.body.appendChild(el);
      for (var t in transforms) {
        if (t in el.style) {
          el.style[t] = 'translate3d(1px,1px,1px)';
          has3d = global.getComputedStyle(el).getPropertyValue(
              transforms[t]);
        }
      }
      document.body.removeChild(el);

      canUseCssTransform3D = (has3d && has3d !== 'none');
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
  if (ol.has.IE) {
    element.style.transformOrigin = '0 0';
  }
};


/**
 * Get the current computed width for the given element including margin,
 * padding and border.
 * Equivalent to jQuery's `$(el).outerWidth(true)`.
 * @param {!Element} element Element.
 * @return {number} The width.
 */
ol.dom.outerWidth = function(element) {
  var global = ol.global;
  var width = element.offsetWidth;
  var style = element.currentStyle || global.getComputedStyle(element);
  width += parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);

  return width;
};


/**
 * Get the current computed height for the given element including margin,
 * padding and border.
 * Equivalent to jQuery's `$(el).outerHeight(true)`.
 * @param {!Element} element Element.
 * @return {number} The height.
 */
ol.dom.outerHeight = function(element) {
  var global = ol.global;
  var height = element.offsetHeight;
  var style = element.currentStyle || global.getComputedStyle(element);
  height += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);

  return height;
};

/**
 * @param {Node} newNode Node to replace old node
 * @param {Node} oldNode The node to be replaced
 */
ol.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
};

/**
 * @param {Node} node The node to remove.
 * @returns {Node} The node that was removed or null.
 */
ol.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
};

/**
 * @param {Node} node The node to remove the children from.
 */
ol.dom.removeChildren = function(node) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
};
