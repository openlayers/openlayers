goog.provide('ol.style.Point');

goog.require('ol.style.Symbolizer');



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
