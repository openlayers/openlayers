goog.provide('ol.easing');

goog.require('goog.fx.easing');


/**
 * from https://raw.github.com/DmitryBaranovskiy/raphael/master/raphael.js
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @todo api
 */
ol.easing.bounce = function(t) {
  var s = 7.5625, p = 2.75, l;
  if (t < (1 / p)) {
    l = s * t * t;
  } else {
    if (t < (2 / p)) {
      t -= (1.5 / p);
      l = s * t * t + 0.75;
    } else {
      if (t < (2.5 / p)) {
        t -= (2.25 / p);
        l = s * t * t + 0.9375;
      } else {
        t -= (2.625 / p);
        l = s * t * t + 0.984375;
      }
    }
  }
  return l;
};


/**
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @todo api
 */
ol.easing.easeIn = goog.fx.easing.easeIn;


/**
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @todo api
 */
ol.easing.easeOut = goog.fx.easing.easeOut;


/**
 * from https://raw.github.com/DmitryBaranovskiy/raphael/master/raphael.js
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @todo api
 */
ol.easing.elastic = function(t) {
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
};


/**
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @todo api
 */
ol.easing.inAndOut = goog.fx.easing.inAndOut;


/**
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @todo api
 */
ol.easing.linear = function(t) {
  return t;
};


/**
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @todo api
 */
ol.easing.upAndDown = function(t) {
  if (t < 0.5) {
    return ol.easing.inAndOut(2 * t);
  } else {
    return 1 - ol.easing.inAndOut(2 * (t - 0.5));
  }
};
