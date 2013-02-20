goog.provide('ol.style.LiteralPoint');
goog.provide('ol.style.Point');

goog.require('ol.style.LiteralSymbolizer');
goog.require('ol.style.Symbolizer');



/**
 * @constructor
 * @implements {ol.style.LiteralSymbolizer}
 */
ol.style.LiteralPoint = function() {};



/**
 * @constructor
 * @implements {ol.style.Symbolizer}
 */
ol.style.Point = function() {};


/**
 * @inheritDoc
 */
ol.style.Point.prototype.createLiteral = goog.abstractMethod;
