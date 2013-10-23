goog.provide('ol.style.PointLiteral');

goog.require('ol.style.Literal');



/**
 * @constructor
 * @extends {ol.style.Literal}
 */
ol.style.PointLiteral = function() {
  goog.base(this);
};
goog.inherits(ol.style.PointLiteral, ol.style.Literal);


/**
 * @inheritDoc
 */
ol.style.PointLiteral.prototype.equals = function(other) {
  return other instanceof ol.style.PointLiteral &&
      this.fillColor == other.fillColor &&
      this.fillOpacity == other.fillOpacity &&
      this.strokeColor == other.strokeColor &&
      this.strokeOpacity == other.strokeOpacity &&
      this.strokeWidth == other.strokeWidth &&
      this.zIndex == other.zIndex;
};
