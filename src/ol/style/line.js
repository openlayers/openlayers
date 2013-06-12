goog.provide('ol.style.Line');
goog.provide('ol.style.LineLiteral');

goog.require('goog.asserts');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Literal');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');


/**
 * @typedef {{strokeColor: (string),
 *            strokeWidth: (number),
 *            opacity: (number)}}
 */
ol.style.LineLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 * @param {ol.style.LineLiteralOptions} options Line literal options.
 */
ol.style.LineLiteral = function(options) {
  goog.base(this);

  goog.asserts.assertString(
      options.strokeColor, 'strokeColor must be a string');
  /** @type {string} */
  this.strokeColor = options.strokeColor;

  goog.asserts.assertNumber(
      options.strokeWidth, 'strokeWidth must be a number');
  /** @type {number} */
  this.strokeWidth = options.strokeWidth;

  goog.asserts.assertNumber(options.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = options.opacity;

};
goog.inherits(ol.style.LineLiteral, ol.style.SymbolizerLiteral);


/**
 * @inheritDoc
 */
ol.style.LineLiteral.prototype.equals = function(lineLiteral) {
  return this.strokeColor == lineLiteral.strokeColor &&
      this.strokeWidth == lineLiteral.strokeWidth &&
      this.opacity == lineLiteral.opacity;
};



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.LineOptions} options Line options.
 */
ol.style.Line = function(options) {
  goog.base(this);

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.strokeColor_ = !goog.isDef(options.strokeColor) ?
      new ol.expression.Literal(ol.style.LineDefaults.strokeColor) :
      (options.strokeColor instanceof ol.expression.Expression) ?
          options.strokeColor : new ol.expression.Literal(options.strokeColor);

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.strokeWidth_ = !goog.isDef(options.strokeWidth) ?
      new ol.expression.Literal(ol.style.LineDefaults.strokeWidth) :
      (options.strokeWidth instanceof ol.expression.Expression) ?
          options.strokeWidth : new ol.expression.Literal(options.strokeWidth);

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.expression.Literal(ol.style.LineDefaults.opacity) :
      (options.opacity instanceof ol.expression.Expression) ?
          options.opacity : new ol.expression.Literal(options.opacity);

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

  var strokeColor = this.strokeColor_.evaluate(attrs, null, feature);
  goog.asserts.assertString(strokeColor, 'strokeColor must be a string');

  var strokeWidth = this.strokeWidth_.evaluate(attrs, null, feature);
  goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');

  var opacity = this.opacity_.evaluate(attrs, null, feature);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.LineLiteral({
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    opacity: opacity
  });
};


/**
 * @type {ol.style.LineLiteral}
 */
ol.style.LineDefaults = new ol.style.LineLiteral({
  strokeColor: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
