goog.provide('ol.style.Symbolizer');
goog.provide('ol.style.Literal');

goog.require('ol.Feature');



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



/**
 * @constructor
 */
ol.style.Symbolizer = function() {};


/**
 * @param {ol.Feature=} opt_feature Feature for evaluating expressions.
 * @return {ol.style.Literal} Literal symbolizer.
 */
ol.style.Symbolizer.prototype.createLiteral = goog.abstractMethod;
