goog.provide('ol.easing');


/**
 * Start slow and speed up.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.easeIn = function(t) {
  return Math.pow(t, 3);
};


/**
 * Start fast and slow down.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.easeOut = function(t) {
  return 1 - ol.easing.easeIn(1 - t);
};


/**
 * Start slow, speed up, and then slow down again.
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 * @api
 */
ol.easing.inAndOut = function(t) {
  return 3 * t * t - 2 * t * t * t;
};


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
