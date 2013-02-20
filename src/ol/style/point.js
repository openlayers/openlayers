goog.provide('ol.style.Point');
goog.provide('ol.style.PointLiteral');

goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');



/**
 * @constructor
 * @implements {ol.style.SymbolizerLiteral}
 */
ol.style.PointLiteral = function() {};



/**
 * @constructor
 * @implements {ol.style.Symbolizer}
 */
ol.style.Point = function() {};


/**
 * @inheritDoc
 */
ol.style.Point.prototype.createLiteral = goog.abstractMethod;
