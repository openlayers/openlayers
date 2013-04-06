goog.provide('ol.math');

goog.require('goog.asserts');


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
 * @return {number} The smallest power of two greater than or equal to x.
 */
ol.math.roundUpToPowerOfTwo = function(x) {
  goog.asserts.assert(0 < x);
  return Math.pow(2, Math.ceil(Math.log(x) / Math.LN2));
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
