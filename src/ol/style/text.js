goog.provide('ol.style.Text');
goog.provide('ol.style.TextLiteral');

goog.require('goog.asserts');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');


/**
 * @typedef {{color: string,
 *            fontFamily: string,
 *            fontSize: number,
 *            text: string,
 *            opacity: number}}
 */
ol.style.TextLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 * @param {ol.style.TextLiteralOptions} options Text literal options.
 */
ol.style.TextLiteral = function(options) {

  goog.asserts.assertString(options.color, 'color must be a string');
  /** @type {string} */
  this.color = options.color;

  goog.asserts.assertString(options.fontFamily, 'fontFamily must be a string');
  /** @type {string} */
  this.fontFamily = options.fontFamily;

  goog.asserts.assertNumber(options.fontSize, 'fontSize must be a number');
  /** @type {number} */
  this.fontSize = options.fontSize;

  goog.asserts.assertString(options.text, 'text must be a string');
  /** @type {string} */
  this.text = options.text;

  goog.asserts.assertNumber(options.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = options.opacity;

};
goog.inherits(ol.style.TextLiteral, ol.style.SymbolizerLiteral);


/**
 * @inheritDoc
 */
ol.style.TextLiteral.prototype.equals = function(textLiteral) {
  return this.color == textLiteral.color &&
      this.fontFamily == textLiteral.fontFamily &&
      this.fontSize == textLiteral.fontSize &&
      this.opacity == textLiteral.opacity;
};



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.TextOptions} options Text options.
 */
ol.style.Text = function(options) {

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.color_ = !goog.isDef(options.color) ?
      new ol.expr.Literal(ol.style.TextDefaults.color) :
      (options.color instanceof ol.expr.Expression) ?
          options.color : new ol.expr.Literal(options.color);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.fontFamily_ = !goog.isDef(options.fontFamily) ?
      new ol.expr.Literal(ol.style.TextDefaults.fontFamily) :
      (options.fontFamily instanceof ol.expr.Expression) ?
          options.fontFamily : new ol.expr.Literal(options.fontFamily);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.fontSize_ = !goog.isDef(options.fontSize) ?
      new ol.expr.Literal(ol.style.TextDefaults.fontSize) :
      (options.fontSize instanceof ol.expr.Expression) ?
          options.fontSize : new ol.expr.Literal(options.fontSize);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.text_ = (options.text instanceof ol.expr.Expression) ?
      options.text : new ol.expr.Literal(options.text);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.expr.Literal(ol.style.TextDefaults.opacity) :
      (options.opacity instanceof ol.expr.Expression) ?
          options.opacity : new ol.expr.Literal(options.opacity);

};
goog.inherits(ol.style.Text, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.TextLiteral} Literal text symbolizer.
 */
ol.style.Text.prototype.createLiteral = function(opt_feature) {

  var color = ol.expr.evaluateFeature(this.color_, opt_feature);
  goog.asserts.assertString(color, 'color must be a string');

  var fontFamily = ol.expr.evaluateFeature(this.fontFamily_, opt_feature);
  goog.asserts.assertString(fontFamily, 'fontFamily must be a string');

  var fontSize = ol.expr.evaluateFeature(this.fontSize_, opt_feature);
  goog.asserts.assertNumber(fontSize, 'fontSize must be a number');

  var text = ol.expr.evaluateFeature(this.text_, opt_feature);
  goog.asserts.assertString(text, 'text must be a string');

  var opacity = ol.expr.evaluateFeature(this.opacity_, opt_feature);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.TextLiteral({
    color: color,
    fontFamily: fontFamily,
    fontSize: fontSize,
    text: text,
    opacity: opacity
  });
};


/**
 * Get the font color.
 * @return {ol.expr.Expression} Font color.
 */
ol.style.Text.prototype.getColor = function() {
  return this.color_;
};


/**
 * Get the font family.
 * @return {ol.expr.Expression} Font family.
 */
ol.style.Text.prototype.getFontFamily = function() {
  return this.fontFamily_;
};


/**
 * Get the font size.
 * @return {ol.expr.Expression} Font size.
 */
ol.style.Text.prototype.getFontSize = function() {
  return this.fontSize_;
};


/**
 * Get the opacity.
 * @return {ol.expr.Expression} Opacity.
 */
ol.style.Text.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Get the text.
 * @return {ol.expr.Expression} Text.
 */
ol.style.Text.prototype.getText = function() {
  return this.text_;
};


/**
 * Set the font color.
 * @param {ol.expr.Expression} color Font color.
 */
ol.style.Text.prototype.setColor = function(color) {
  goog.asserts.assertInstanceof(color, ol.expr.Expression);
  this.color_ = color;
};


/**
 * Set the font family.
 * @param {ol.expr.Expression} fontFamily Font family.
 */
ol.style.Text.prototype.setFontFamily = function(fontFamily) {
  goog.asserts.assertInstanceof(fontFamily, ol.expr.Expression);
  this.fontFamily_ = fontFamily;
};


/**
 * Set the font size.
 * @param {ol.expr.Expression} fontSize Font size.
 */
ol.style.Text.prototype.setFontSize = function(fontSize) {
  goog.asserts.assertInstanceof(fontSize, ol.expr.Expression);
  this.fontSize_ = fontSize;
};


/**
 * Set the opacity.
 * @param {ol.expr.Expression} opacity Opacity.
 */
ol.style.Text.prototype.setOpacity = function(opacity) {
  goog.asserts.assertInstanceof(opacity, ol.expr.Expression);
  this.opacity_ = opacity;
};


/**
 * Set the text.
 * @param {ol.expr.Expression} text Text.
 */
ol.style.Text.prototype.setText = function(text) {
  goog.asserts.assertInstanceof(text, ol.expr.Expression);
  this.text_ = text;
};


/**
 * @type {ol.style.TextLiteral}
 */
ol.style.TextDefaults = new ol.style.TextLiteral({
  color: '#000',
  fontFamily: 'sans-serif',
  fontSize: 10,
  text: '',
  opacity: 1
});
