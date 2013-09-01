goog.provide('ol.style.TextPin');

goog.require('goog.asserts');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.Text');



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.TextPinOptions}
 *            options Text options.
 */
ol.style.TextPin = function(options) {
  goog.base(this);

  this.strokeColor_ = !goog.isDef(options.strokeColor) ?
      new ol.expr.Literal(ol.style.TextPinDefaults.strokeColor) :
      (options.strokeColor instanceof ol.expr.Expression) ?
      options.strokeColor :
      new ol.expr.Literal(options.strokeColor);
  this.strokeOpacity_ = !goog.isDef(options.strokeOpacity) ?
      new ol.expr.Literal(ol.style.TextPinDefaults.strokeOpacity) :
      (options.strokeOpacity instanceof ol.expr.Expression) ?
      options.strokeOpacity :
      new ol.expr.Literal(options.strokeOpacity);
  this.strokeWidth_ = !goog.isDef(options.strokeWidth) ?
      new ol.expr.Literal(ol.style.TextPinDefaults.strokeWidth) :
      (options.strokeWidth instanceof ol.expr.Expression) ?
      options.strokeWidth :
      new ol.expr.Literal(options.strokeWidth);
  this.fillColor_ = !goog.isDef(options.fillColor) ?
      new ol.expr.Literal(ol.style.TextPinDefaults.fillColor) :
      (options.fillColor instanceof ol.expr.Expression) ?
      options.fillColor :
      new ol.expr.Literal(options.fillColor);
  this.fillOpacity_ = !goog.isDef(options.fillOpacity) ?
      new ol.expr.Literal(ol.style.TextPinDefaults.fillOpacity) :
      (options.fillOpacity instanceof ol.expr.Expression) ?
      options.fillOpacity :
      new ol.expr.Literal(options.fillOpacity);
  this.fontFamily_ = !goog.isDef(options.fontFamily) ?
      new ol.expr.Literal(ol.style.TextPinDefaults.fontFamily) :
      (options.fontFamily instanceof ol.expr.Expression) ?
      options.fontFamily :
      new ol.expr.Literal(options.fontFamily);
  this.fontColor_ = !goog.isDef(options.fontColor) ?
      new ol.expr.Literal(ol.style.TextPinDefaults.fontColor) :
      (options.fontColor instanceof ol.expr.Expression) ?
      options.fontColor :
      new ol.expr.Literal(options.fontColor);
  this.fontSize_ = !goog.isDef(options.fontSize) ?
      new ol.expr.Literal(ol.style.TextPinDefaults.fontSize) :
      (options.fontSize instanceof ol.expr.Expression) ?
      options.fontSize :
      new ol.expr.Literal(options.fontSize);
  this.text_ = (options.text instanceof ol.expr.Expression) ?
      options.text :
      new ol.expr.Literal(options.text);
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
  var strokeColor = ol.expr
      .evaluateFeature(this.strokeColor_, opt_feature);
  goog.asserts.assertString(strokeColor, 'strokeColor must be a string');

  var strokeWidth = ol.expr.evaluateFeature(this.strokeWidth_, opt_feature);
  goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');

  var strokeOpacity = ol.expr.evaluateFeature(this.strokeOpacity_, opt_feature);
  goog.asserts.assertNumber(strokeOpacity, 'strokeOpacity must be a number');

  var fillColor = ol.expr.evaluateFeature(this.fillColor_, opt_feature);
  goog.asserts.assertString(fillColor, 'fillColor must be a string');

  var fillOpacity = ol.expr.evaluateFeature(this.fillOpacity_, opt_feature);
  goog.asserts.assertNumber(fillOpacity, 'fillOpacity must be a number');

  var fontFamily = ol.expr.evaluateFeature(this.fontFamily_, opt_feature);
  goog.asserts.assertString(fontFamily, 'fontFamily must be a string');

  var fontSize = ol.expr.evaluateFeature(this.fontSize_, opt_feature);
  goog.asserts.assertNumber(fontSize, 'fontSize must be a number');

  var fontColor = ol.expr.evaluateFeature(this.fontColor_, opt_feature);
  goog.asserts.assertString(fontColor, 'fontColor must be a string');

  var text = ol.expr.evaluateFeature(this.text_, opt_feature);
  goog.asserts.assertString(text, 'text must be a string');

  return new ol.style.TextPinLiteral({
    fontFamily: fontFamily,
    fontSize: fontSize,
    fontColor: fontColor,
    text: text,
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    strokeOpacity: strokeOpacity,
    fillColor: fillColor,
    fillOpacity: fillOpacity
  });
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
 * Get the font color.
 *
 * @return {ol.expr.Expression} Font color.
 */
ol.style.TextPin.prototype.getFontColor = function() {
  return this.fontColor_;
};


/**
 * Get the stroke color.
 *
 * @return {ol.expr.Expression} Stroke color.
 */
ol.style.TextPin.prototype.getStrokeColor = function() {
  return this.strokeColor_;
};


/**
 * Get the fill color.
 *
 * @return {ol.expr.Expression} Fill color.
 */
ol.style.TextPin.prototype.getFillColor = function() {
  return this.strokeColor_;
};


/**
 * Get the fill opacity.
 *
 * @return {ol.expr.Expression} Fill opacity.
 */
ol.style.TextPin.prototype.getFillOpacity = function() {
  return this.fillOpacity_;
};


/**
 * Get the stroke opacity.
 *
 * @return {ol.expr.Expression} Stroke opacity.
 */
ol.style.TextPin.prototype.getStrokeOpacity = function() {
  return this.strokeOpacity_;
};


/**
 * Get the stroke width.
 *
 * @return {ol.expr.Expression} Stroke width.
 */
ol.style.TextPin.prototype.getStrokeWidth = function() {
  return this.strokeWidth_;
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
 * Set the font color.
 *
 * @param {ol.expr.Expression}
 *            fontColor Font color.
 */
ol.style.TextPin.prototype.setFontColor = function(fontColor) {
  goog.asserts.assertInstanceof(fontColor, ol.expr.Expression);
  this.fontColor_ = fontColor;
};


/**
 * Set the fill opacity.
 *
 * @param {ol.expr.Expression}
 *            fillOpacity FillOpacity.
 */
ol.style.TextPin.prototype.setFillOpacity = function(fillOpacity) {
  goog.asserts.assertInstanceof(fillOpacity, ol.expr.Expression);
  this.fillOpacity_ = fillOpacity;
};


/**
 * Set the stroke opacity.
 *
 * @param {ol.expr.Expression}
 *            strokeOpacity StrokeOpacity.
 */
ol.style.TextPin.prototype.setStrokeOpacity = function(strokeOpacity) {
  goog.asserts.assertInstanceof(strokeOpacity, ol.expr.Expression);
  this.strokeOpacity_ = strokeOpacity;
};


/**
 * Set the stroke width.
 *
 * @param {ol.expr.Expression}
 *            strokeWidth StrokeWidth.
 */
ol.style.TextPin.prototype.setStrokeWidth = function(strokeWidth) {
  goog.asserts.assertInstanceof(strokeWidth, ol.expr.Expression);
  this.strokeWidth_ = strokeWidth;
};


/**
 * Set the fill color.
 *
 * @param {ol.expr.Expression}
 *            fillColor FillColor.
 */
ol.style.TextPin.prototype.setFillColor = function(fillColor) {
  goog.asserts.assertInstanceof(fillColor, ol.expr.Expression);
  this.fillColor_ = fillColor;
};


/**
 * Set the stroke color.
 *
 * @param {ol.expr.Expression}
 *            strokeColor StrokeColor.
 */
ol.style.TextPin.prototype.setStrokeColor = function(strokeColor) {
  goog.asserts.assertInstanceof(strokeColor, ol.expr.Expression);
  this.strokeColor_ = strokeColor;
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


/**
 * @type {ol.style.TextPinLiteral}
 */
ol.style.TextPinDefaults = new ol.style.TextPinLiteral({
  fontFamily: 'sans-serif',
  fontSize: 10,
  fontColor: '#fff',
  text: '',
  strokeColor: '#000',
  strokeWidth: 1,
  strokeOpacity: 1,
  fillColor: '#ccc',
  fillOpacity: 1
});
