goog.provide('ol.style.Symbolizer');
goog.provide('ol.style.SymbolizerLiteral');

goog.require('ol.Feature');



/**
 * @interface
 */
ol.style.SymbolizerLiteral = function() {};



/**
 * @interface
 */
ol.style.Symbolizer = function() {};


/**
 * @param {ol.Feature} feature Feature for evaluating expressions.
 * @return {ol.style.SymbolizerLiteral} Literal symbolizer.
 */
ol.style.Symbolizer.prototype.createLiteral = function(feature) {};
