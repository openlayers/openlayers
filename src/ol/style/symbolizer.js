goog.provide('ol.style.Symbolizer');

goog.require('ol.Feature');
goog.require('ol.style.Literal');



/**
 * @constructor
 */
ol.style.Symbolizer = function() {};


/**
 * Create a literal from the symbolizer given a complete feature and a geometry
 * type.
 * @param {undefined|ol.Feature} feature Feature for evaluating expressions.
 * @param {undefined|ol.geom.GeometryType} type a geometry type.
 * @return {ol.style.Literal} Literal symbolizer.
 */
ol.style.Symbolizer.prototype.createLiteral = goog.abstractMethod;
