goog.provide('ol.style.Point');
goog.provide('ol.style.PointLiteral');

goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 */
ol.style.PointLiteral = function() {
  goog.base(this);
};
goog.inherits(ol.style.PointLiteral, ol.style.SymbolizerLiteral);



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 */
ol.style.Point = function() {
  goog.base(this);
};
goog.inherits(ol.style.Point, ol.style.Symbolizer);


/**
 * @inheritDoc
 */
ol.style.Point.prototype.createLiteral = goog.abstractMethod;
