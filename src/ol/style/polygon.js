goog.provide('ol.style.Polygon');
goog.provide('ol.style.PolygonLiteral');

goog.require('ol.Expression');
goog.require('ol.ExpressionLiteral');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');


/**
 * @typedef {{fillStyle: (string),
 *            strokeStyle: (string),
 *            strokeWidth: (number),
 *            opacity: (number)}}
 */
ol.style.PolygonLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 * @param {ol.style.PolygonLiteralOptions} config Symbolizer properties.
 */
ol.style.PolygonLiteral = function(config) {
  goog.base(this);

  /** @type {string} */
  this.fillStyle = config.fillStyle;

  /** @type {string} */
  this.strokeStyle = config.strokeStyle;

  /** @type {number} */
  this.strokeWidth = config.strokeWidth;

  /** @type {number} */
  this.opacity = config.opacity;

};
goog.inherits(ol.style.PolygonLiteral, ol.style.SymbolizerLiteral);


/**
 * @typedef {{fillStyle: (string|ol.Expression),
 *            strokeStyle: (string|ol.Expression),
 *            strokeWidth: (number|ol.Expression),
 *            opacity: (number|ol.Expression)}}
 */
ol.style.PolygonOptions;



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.PolygonOptions} options Symbolizer properties.
 */
ol.style.Polygon = function(options) {
  goog.base(this);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.fillStyle_ = !goog.isDef(options.fillStyle) ?
      new ol.ExpressionLiteral(ol.style.PolygonDefaults.fillStyle) :
      (options.fillStyle instanceof ol.Expression) ?
          options.fillStyle : new ol.ExpressionLiteral(options.fillStyle);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeStyle_ = !goog.isDef(options.strokeStyle) ?
      new ol.ExpressionLiteral(ol.style.PolygonDefaults.strokeStyle) :
      (options.strokeStyle instanceof ol.Expression) ?
          options.strokeStyle : new ol.ExpressionLiteral(options.strokeStyle);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeWidth_ = !goog.isDef(options.strokeWidth) ?
      new ol.ExpressionLiteral(ol.style.PolygonDefaults.strokeWidth) :
      (options.strokeWidth instanceof ol.Expression) ?
          options.strokeWidth : new ol.ExpressionLiteral(options.strokeWidth);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.ExpressionLiteral(ol.style.PolygonDefaults.opacity) :
      (options.opacity instanceof ol.Expression) ?
          options.opacity : new ol.ExpressionLiteral(options.opacity);

};
goog.inherits(ol.style.Polygon, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.PolygonLiteral} Literal shape symbolizer.
 */
ol.style.Polygon.prototype.createLiteral = function(feature) {
  var attrs = feature.getAttributes();

  var fillStyle = this.fillStyle_.evaluate(feature, attrs);
  goog.asserts.assertString(fillStyle, 'fillStyle must be a string');

  var strokeStyle = this.strokeStyle_.evaluate(feature, attrs);
  goog.asserts.assertString(strokeStyle, 'strokeStyle must be a string');

  var strokeWidth = this.strokeWidth_.evaluate(feature, attrs);
  goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');

  var opacity = this.opacity_.evaluate(feature, attrs);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.PolygonLiteral({
    fillStyle: fillStyle,
    strokeStyle: strokeStyle,
    strokeWidth: strokeWidth,
    opacity: opacity
  });
};


/**
 * @type {ol.style.PolygonLiteral}
 */
ol.style.PolygonDefaults = new ol.style.PolygonLiteral({
  fillStyle: '#ffffff',
  strokeStyle: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
