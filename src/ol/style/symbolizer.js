goog.provide('ol.style.Symbolizer');

goog.require('ol.Feature');
goog.require('ol.style.Literal');



/**
 * @constructor
 */
ol.style.Symbolizer = function() {};


/**
 * @param {ol.Feature=} opt_feature Feature for evaluating expressions.
 * @return {ol.style.Literal} Literal symbolizer.
 */
ol.style.Symbolizer.prototype.createLiteral = goog.abstractMethod;
