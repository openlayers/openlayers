goog.provide('ol.style.Line');
goog.provide('ol.style.LineLiteral');

goog.require('goog.asserts');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
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
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeColor_ = !goog.isDef(options.strokeColor) ?
      new ol.expr.Literal(ol.style.LineDefaults.strokeColor) :
      (options.strokeColor instanceof ol.expr.Expression) ?
          options.strokeColor : new ol.expr.Literal(options.strokeColor);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeWidth_ = !goog.isDef(options.strokeWidth) ?
      new ol.expr.Literal(ol.style.LineDefaults.strokeWidth) :
      (options.strokeWidth instanceof ol.expr.Expression) ?
          options.strokeWidth : new ol.expr.Literal(options.strokeWidth);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.expr.Literal(ol.style.LineDefaults.opacity) :
      (options.opacity instanceof ol.expr.Expression) ?
          options.opacity : new ol.expr.Literal(options.opacity);

};
goog.inherits(ol.style.Line, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.LineLiteral} Literal line symbolizer.
 */
ol.style.Line.prototype.createLiteral = function(opt_feature) {

  var strokeColor = ol.expr.evaluateFeature(
      this.strokeColor_, opt_feature);
  goog.asserts.assertString(strokeColor, 'strokeColor must be a string');

  var strokeWidth = ol.expr.evaluateFeature(
      this.strokeWidth_, opt_feature);
  goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');

  var opacity = ol.expr.evaluateFeature(this.opacity_, opt_feature);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.LineLiteral({
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    opacity: opacity
  });
};


/**
 * Get the stroke color.
 * @return {ol.expr.Expression} Stroke color.
 */
ol.style.Line.prototype.getStrokeColor = function() {
  return this.strokeColor_;
};


/**
 * Get the stroke width.
 * @return {ol.expr.Expression} Stroke width.
 */
ol.style.Line.prototype.getStrokeWidth = function() {
  return this.strokeWidth_;
};


/**
 * Get the stroke opacity.
 * @return {ol.expr.Expression} Stroke opacity.
 */
ol.style.Line.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Set the stroke color.
 * @param {ol.expr.Expression} strokeColor Stroke color.
 */
ol.style.Line.prototype.setStrokeColor = function(strokeColor) {
  goog.asserts.assertInstanceof(strokeColor, ol.expr.Expression);
  this.strokeColor_ = strokeColor;
};


/**
 * Set the stroke width.
 * @param {ol.expr.Expression} strokeWidth Stroke width.
 */
ol.style.Line.prototype.setStrokeWidth = function(strokeWidth) {
  goog.asserts.assertInstanceof(strokeWidth, ol.expr.Expression);
  this.strokeWidth_ = strokeWidth;
};


/**
 * Set the stroke opacity.
 * @param {ol.expr.Expression} opacity Stroke opacity.
 */
ol.style.Line.prototype.setOpacity = function(opacity) {
  goog.asserts.assertInstanceof(opacity, ol.expr.Expression);
  this.opacity_ = opacity;
};


/**
 * @type {ol.style.LineLiteral}
 */
ol.style.LineDefaults = new ol.style.LineLiteral({
  strokeColor: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
