goog.provide('ol.easing');

goog.require('goog.fx.easing');


/**
 * Start slow and speed up.
 * @function
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.easeIn = goog.fx.easing.easeIn;


/**
 * Start fast and slow down.
 * @function
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.easeOut = goog.fx.easing.easeOut;


/**
 * Start slow, speed up, and then slow down again.
 * @function
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.inAndOut = goog.fx.easing.inAndOut;


/**
 * Maintain a constant speed over time.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.linear = function(t) {
  return t;
};


/**
 * Start slow, speed up, and at the very end slow down again.  This has the
 * same general behavior as {@link ol.easing.inAndOut}, but the final slowdown
 * is delayed.
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
