goog.provide('ol.easing');


/**
 * @param {number} t Input between 0 and 1.
 * @return {number} Output between 0 and 1.
 */
ol.easing.upAndDown = function(t) {
  if (t < 0.5) {
    return goog.fx.easing.inAndOut(2 * t);
  } else {
    return 1 - goog.fx.easing.inAndOut(2 * (t - 0.5));
  }
};
