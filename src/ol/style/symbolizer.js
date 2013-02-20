goog.provide('ol.style.LiteralSymbolizer');
goog.provide('ol.style.Symbolizer');

goog.require('ol.Feature');



/**
 * @interface
 */
ol.style.LiteralSymbolizer = function() {};



/**
 * @interface
 */
ol.style.Symbolizer = function() {};


/**
 * @param {ol.Feature} feature Feature for evaluating expressions.
 * @return {ol.style.LiteralSymbolizer} Literal symbolizer.
 */
ol.style.Symbolizer.prototype.createLiteral = function(feature) {};
