goog.provide('ol.style.TextPin');
goog.provide('ol.style.TextPinLiteral');

goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');
goog.require('ol.style.Text');
goog.require('ol.style.TextDefaults');
goog.require('ol.style.TextLiteral');



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 * @param {ol.style.TextPinLiteralOptions}
 *            options Text literal options.
 */
ol.style.TextPinLiteral = function(options) {
  goog.base(this);

  this.strokeColor = options.strokeColor;
  this.strokeWidth = options.strokeWidth;
  this.strokeOpacity = options.strokeOpacity;
  this.fillColor = options.fillColor;
  this.fontFamily = options.fontFamily;
  this.fontSize = options.fontSize;
  this.text = options.text;
  this.opacity = options.opacity;
  this.color = options.color;
};
goog.inherits(ol.style.TextPinLiteral, ol.style.SymbolizerLiteral);



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.TextPinOptions}
 *            options Text options.
 */
ol.style.TextPin = function(options) {
  goog.base(this);

  this.color_ = !goog.isDef(options.color) ?
    new ol.expr.Literal(ol.style.TextDefaults.color) :
    ((options.color instanceof ol.expr.Expression) ?
    options.color :
    new ol.expr.Literal(options.color));
  this.strokeColor_ = !goog.isDef(options.strokeColor) ?
    new ol.expr.Literal(ol.style.TextDefaults.strokeColor) :
    (options.strokeColor instanceof ol.expr.Expression) ?
    options.strokeColor :
    new ol.expr.Literal(options.strokeColor);
  this.fillColor_ = !goog.isDef(options.fillColor) ?
    new ol.expr.Literal(ol.style.TextDefaults.fillColor) :
    (options.fillColor instanceof ol.expr.Expression) ?
    options.fillColor :
    new ol.expr.Literal(options.fillColor);
  this.fontFamily_ = !goog.isDef(options.fontFamily) ?
    new ol.expr.Literal(ol.style.TextDefaults.fontFamily) :
    (options.fontFamily instanceof ol.expr.Expression) ?
    options.fontFamily :
    new ol.expr.Literal(options.fontFamily);
  this.fontSize_ = !goog.isDef(options.fontSize) ?
    new ol.expr.Literal(ol.style.TextDefaults.fontSize) :
    (options.fontSize instanceof ol.expr.Expression) ?
    options.fontSize :
    new ol.expr.Literal(options.fontSize);
  this.text_ = (options.text instanceof ol.expr.Expression) ?
    options.text :
    new ol.expr.Literal(options.text);
  this.opacity_ = !goog.isDef(options.opacity) ?
    new ol.expr.Literal(ol.style.TextDefaults.opacity) :
    (options.opacity instanceof ol.expr.Expression) ?
    options.opacity :
    new ol.expr.Literal(options.opacity);
};
goog.inherits(ol.style.TextPin, ol.style.Symbolizer);


/**
 * @inheritDoc
 */
ol.style.TextPinLiteral.prototype.equals = function(textPinLiteral) {
  return this.color == textPinLiteral.color &&
    this.strokeColor == textPinLiteral.strokeColor &&
    this.fillColor == textPinLiteral.fillColor &&
    this.fontFamily == textPinLiteral.fontFamily &&
    this.fontSize == textPinLiteral.fontSize &&
    this.opacity == textPinLiteral.opacity;
};


/**
 * @inheritDoc
 */
ol.style.TextPin.prototype.createLiteral = function(opt_feature) {
  var color = ol.expr.evaluateFeature(this.color_, opt_feature);
  goog.asserts.assertString(color, 'color must be a string');

  var strokeColor = ol.expr
      .evaluateFeature(this.strokeColor_, opt_feature);
  goog.asserts.assertString(strokeColor, 'strokeColor must be a string');

  var fillColor = ol.expr.evaluateFeature(this.fillColor_, opt_feature);
  goog.asserts.assertString(fillColor, 'fillColor must be a string');

  var fontFamily = ol.expr.evaluateFeature(this.fontFamily_, opt_feature);
  goog.asserts.assertString(fontFamily, 'fontFamily must be a string');

  var fontSize = ol.expr.evaluateFeature(this.fontSize_, opt_feature);
  goog.asserts.assertNumber(fontSize, 'fontSize must be a number');

  var text = ol.expr.evaluateFeature(this.text_, opt_feature);
  goog.asserts.assertString(text, 'text must be a string');

  var opacity = ol.expr.evaluateFeature(this.opacity_, opt_feature);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.TextPinLiteral({
    color: color,
    strokeColor: strokeColor,
    fillColor: fillColor,
    fontFamily: fontFamily,
    fontSize: fontSize,
    text: text,
    opacity: opacity
  });
};


/**
 * Get the font color.
 *
 * @return {ol.expr.Expression} Font color.
 */
ol.style.TextPin.prototype.getColor = function() {
  return this.color_;
};


/**
 * Get the font family.
 *
 * @return {ol.expr.Expression} Font family.
 */
ol.style.TextPin.prototype.getFontFamily = function() {
  return this.fontFamily_;
};


/**
 * Get the font size.
 *
 * @return {ol.expr.Expression} Font size.
 */
ol.style.TextPin.prototype.getFontSize = function() {
  return this.fontSize_;
};


/**
 * Get the opacity.
 *
 * @return {ol.expr.Expression} Opacity.
 */
ol.style.TextPin.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Get the text.
 *
 * @return {ol.expr.Expression} Text.
 */
ol.style.TextPin.prototype.getText = function() {
  return this.text_;
};


/**
 * Set the font color.
 *
 * @param {ol.expr.Expression}
 *            color Font color.
 */
ol.style.TextPin.prototype.setColor = function(color) {
  goog.asserts.assertInstanceof(color, ol.expr.Expression);
  this.color_ = color;
};


/**
 * Set the font family.
 *
 * @param {ol.expr.Expression}
 *            fontFamily Font family.
 */
ol.style.TextPin.prototype.setFontFamily = function(fontFamily) {
  goog.asserts.assertInstanceof(fontFamily, ol.expr.Expression);
  this.fontFamily_ = fontFamily;
};


/**
 * Set the font size.
 *
 * @param {ol.expr.Expression}
 *            fontSize Font size.
 */
ol.style.TextPin.prototype.setFontSize = function(fontSize) {
  goog.asserts.assertInstanceof(fontSize, ol.expr.Expression);
  this.fontSize_ = fontSize;
};


/**
 * Set the opacity.
 *
 * @param {ol.expr.Expression}
 *            opacity Opacity.
 */
ol.style.TextPin.prototype.setOpacity = function(opacity) {
  goog.asserts.assertInstanceof(opacity, ol.expr.Expression);
  this.opacity_ = opacity;
};


/**
 * Set the text.
 *
 * @param {ol.expr.Expression}
 *            text Text.
 */
ol.style.TextPin.prototype.setText = function(text) {
  goog.asserts.assertInstanceof(text, ol.expr.Expression);
  this.text_ = text;
};
