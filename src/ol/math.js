goog.provide('ol.math');


/**
 * @param {number} x X.
 * @return {number} Hyperbolic cosine of x.
 */
ol.math.cosh = function(x) {
  return (Math.exp(x) + Math.exp(-x)) / 2;
};


/**
 * @param {number} x X.
 * @return {number} Hyperbolic cotangent of x.
 */
ol.math.coth = function(x) {
  var expMinusTwoX = Math.exp(-2 * x);
  return (1 + expMinusTwoX) / (1 - expMinusTwoX);
};


/**
 * @param {number} x X.
 * @return {number} Hyperbolic cosecant of x.
 */
ol.math.csch = function(x) {
  return 2 / (Math.exp(x) - Math.exp(-x));
};


/**
 * @param {number} x X.
 * @return {number} Hyperbolic secant of x.
 */
ol.math.sech = function(x) {
  return 2 / (Math.exp(x) + Math.exp(-x));
};


/**
 * @param {number} x X.
 * @return {number} Hyperbolic sine of x.
 */
ol.math.sinh = function(x) {
  return (Math.exp(x) - Math.exp(-x)) / 2;
};


/**
 * @param {number} x X.
 * @return {number} Hyperbolic tangent of x.
 */
ol.math.tanh = function(x) {
  var expMinusTwoX = Math.exp(-2 * x);
  return (1 - expMinusTwoX) / (1 + expMinusTwoX);
};
