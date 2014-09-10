goog.provide('ol.easing');

goog.require('goog.fx.easing');


/**
 * @function
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.easeIn = goog.fx.easing.easeIn;


/**
 * @function
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.easeOut = goog.fx.easing.easeOut;


/**
 * @function
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.inAndOut = goog.fx.easing.inAndOut;


/**
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.linear = function(t) {
  return t;
};


/**
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.upAndDown = function(t) {
  if (t < 0.5) {
    return ol.easing.inAndOut(2 * t);
  } else {
    return 1 - ol.easing.inAndOut(2 * (t - 0.5));
  }
};
