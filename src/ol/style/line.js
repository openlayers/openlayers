goog.provide('ol.style.Line');
goog.provide('ol.style.LineLiteral');

goog.require('ol.Expression');
goog.require('ol.ExpressionLiteral');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');


/**
 * @typedef {{strokeStyle: (string),
 *            strokeWidth: (number),
 *            opacity: (number)}}
 */
ol.style.LineLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 * @param {ol.style.LineLiteralOptions} config Symbolizer properties.
 */
ol.style.LineLiteral = function(config) {
  goog.base(this);

  goog.asserts.assertString(config.strokeStyle, 'strokeStyle must be a string');
  /** @type {string} */
  this.strokeStyle = config.strokeStyle;

  goog.asserts.assertNumber(config.strokeWidth, 'strokeWidth must be a number');
  /** @type {number} */
  this.strokeWidth = config.strokeWidth;

  goog.asserts.assertNumber(config.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = config.opacity;

};
goog.inherits(ol.style.LineLiteral, ol.style.SymbolizerLiteral);


/**
 * @inheritDoc
 */
ol.style.LineLiteral.prototype.equals = function(lineLiteral) {
  return this.strokeStyle == lineLiteral.strokeStyle &&
      this.strokeWidth == lineLiteral.strokeWidth &&
      this.opacity == lineLiteral.opacity;
};



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.LineOptions} options Symbolizer properties.
 */
ol.style.Line = function(options) {
  goog.base(this);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeStyle_ = !goog.isDef(options.strokeStyle) ?
      new ol.ExpressionLiteral(ol.style.LineDefaults.strokeStyle) :
      (options.strokeStyle instanceof ol.Expression) ?
          options.strokeStyle : new ol.ExpressionLiteral(options.strokeStyle);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeWidth_ = !goog.isDef(options.strokeWidth) ?
      new ol.ExpressionLiteral(ol.style.LineDefaults.strokeWidth) :
      (options.strokeWidth instanceof ol.Expression) ?
          options.strokeWidth : new ol.ExpressionLiteral(options.strokeWidth);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.ExpressionLiteral(ol.style.LineDefaults.opacity) :
      (options.opacity instanceof ol.Expression) ?
          options.opacity : new ol.ExpressionLiteral(options.opacity);

};
goog.inherits(ol.style.Line, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.LineLiteral} Literal line symbolizer.
 */
ol.style.Line.prototype.createLiteral = function(opt_feature) {
  var attrs,
      feature = opt_feature;
  if (goog.isDef(feature)) {
    attrs = feature.getAttributes();
  }

  var strokeStyle = this.strokeStyle_.evaluate(feature, attrs);
  goog.asserts.assertString(strokeStyle, 'strokeStyle must be a string');

  var strokeWidth = this.strokeWidth_.evaluate(feature, attrs);
  goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');

  var opacity = this.opacity_.evaluate(feature, attrs);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.LineLiteral({
    strokeStyle: strokeStyle,
    strokeWidth: strokeWidth,
    opacity: opacity
  });
};


/**
 * @type {ol.style.LineLiteral}
 */
ol.style.LineDefaults = new ol.style.LineLiteral({
  strokeStyle: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
