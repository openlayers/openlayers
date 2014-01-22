goog.provide('ol.style.Literal');



/**
 * @constructor
 */
ol.style.Literal = function() {};


/**
 * @param {ol.style.Literal} symbolizerLiteral Symbolizer literal to
 *     compare to.
 * @return {boolean} Is the passed symbolizer literal equal to this instance?
 */
ol.style.Literal.prototype.equals = goog.abstractMethod;
