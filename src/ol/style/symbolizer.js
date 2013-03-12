goog.provide('ol.style.Symbolizer');
goog.provide('ol.style.SymbolizerLiteral');

goog.require('ol.Feature');



/**
 * @constructor
 */
ol.style.SymbolizerLiteral = function() {};


/**
 * @param {ol.style.SymbolizerLiteral} symbolizerLiteral Symbolizer literal to
 *     compare to.
 * @return {boolean} Is the passed symbolizer literal equal to this instance?
 */
ol.style.SymbolizerLiteral.prototype.equals = goog.abstractMethod;



/**
 * @constructor
 */
ol.style.Symbolizer = function() {};


/**
 * @param {ol.Feature=} opt_feature Feature for evaluating expressions.
 * @return {ol.style.SymbolizerLiteral} Literal symbolizer.
 */
ol.style.Symbolizer.prototype.createLiteral = goog.abstractMethod;
