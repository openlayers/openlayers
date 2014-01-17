goog.provide('ol.style.Symbolizer');

goog.require('ol.Feature');
goog.require('ol.style.Literal');



/**
 * @constructor
 */
ol.style.Symbolizer = function() {};


/**
 * Create a literal from the symbolizer given a complete feature or a geometry
 * type.
 * @param {ol.geom.GeometryType|ol.Feature} featureOrType Feature for evaluating
 *     expressions or a geometry type.
 * @return {ol.style.Literal} Literal symbolizer.
 */
ol.style.Symbolizer.prototype.createLiteral = goog.abstractMethod;
