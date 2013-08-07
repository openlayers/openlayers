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
 *            strokeOpacity: (number),
 *            strokeWidth: (number)}}
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
      options.strokeOpacity, 'strokeOpacity must be a number');
  /** @type {number} */
  this.strokeOpacity = options.strokeOpacity;

  goog.asserts.assertNumber(
      options.strokeWidth, 'strokeWidth must be a number');
  /** @type {number} */
  this.strokeWidth = options.strokeWidth;

};
goog.inherits(ol.style.LineLiteral, ol.style.SymbolizerLiteral);


/**
 * @inheritDoc
 */
ol.style.LineLiteral.prototype.equals = function(lineLiteral) {
  return this.strokeColor == lineLiteral.strokeColor &&
      this.strokeOpacity == lineLiteral.strokeOpacity &&
      this.strokeWidth == lineLiteral.strokeWidth;
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
  this.strokeOpacity_ = !goog.isDef(options.strokeOpacity) ?
      new ol.expr.Literal(ol.style.LineDefaults.strokeOpacity) :
      (options.strokeOpacity instanceof ol.expr.Expression) ?
          options.strokeOpacity : new ol.expr.Literal(options.strokeOpacity);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeWidth_ = !goog.isDef(options.strokeWidth) ?
      new ol.expr.Literal(ol.style.LineDefaults.strokeWidth) :
      (options.strokeWidth instanceof ol.expr.Expression) ?
          options.strokeWidth : new ol.expr.Literal(options.strokeWidth);

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

  var strokeOpacity = ol.expr.evaluateFeature(
      this.strokeOpacity_, opt_feature);
  goog.asserts.assertNumber(strokeOpacity, 'strokeOpacity must be a number');

  var strokeWidth = ol.expr.evaluateFeature(
      this.strokeWidth_, opt_feature);
  goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');


  return new ol.style.LineLiteral({
    strokeColor: strokeColor,
    strokeOpacity: strokeOpacity,
    strokeWidth: strokeWidth
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
 * Get the stroke opacity.
 * @return {ol.expr.Expression} Stroke opacity.
 */
ol.style.Line.prototype.getStrokeOpacity = function() {
  return this.strokeOpacity_;
};


/**
 * Get the stroke width.
 * @return {ol.expr.Expression} Stroke width.
 */
ol.style.Line.prototype.getStrokeWidth = function() {
  return this.strokeWidth_;
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
 * Set the stroke opacity.
 * @param {ol.expr.Expression} strokeOpacity Stroke opacity.
 */
ol.style.Line.prototype.setStrokeOpacity = function(strokeOpacity) {
  goog.asserts.assertInstanceof(strokeOpacity, ol.expr.Expression);
  this.strokeOpacity_ = strokeOpacity;
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
 * @type {ol.style.LineLiteral}
 */
ol.style.LineDefaults = new ol.style.LineLiteral({
  strokeColor: '#696969',
  strokeOpacity: 0.75,
  strokeWidth: 1.5
});
