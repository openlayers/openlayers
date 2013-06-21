goog.provide('ol.style.Text');
goog.provide('ol.style.TextLiteral');

goog.require('goog.asserts');
goog.require('ol.expression.Expression');
goog.require('ol.expression.Literal');
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
   * @type {ol.expression.Expression}
   * @private
   */
  this.color_ = !goog.isDef(options.color) ?
      new ol.expression.Literal(ol.style.TextDefaults.color) :
      (options.color instanceof ol.expression.Expression) ?
          options.color : new ol.expression.Literal(options.color);

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.fontFamily_ = !goog.isDef(options.fontFamily) ?
      new ol.expression.Literal(ol.style.TextDefaults.fontFamily) :
      (options.fontFamily instanceof ol.expression.Expression) ?
          options.fontFamily : new ol.expression.Literal(options.fontFamily);

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.fontSize_ = !goog.isDef(options.fontSize) ?
      new ol.expression.Literal(ol.style.TextDefaults.fontSize) :
      (options.fontSize instanceof ol.expression.Expression) ?
          options.fontSize : new ol.expression.Literal(options.fontSize);

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.text_ = (options.text instanceof ol.expression.Expression) ?
      options.text : new ol.expression.Literal(options.text);

  /**
   * @type {ol.expression.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.expression.Literal(ol.style.TextDefaults.opacity) :
      (options.opacity instanceof ol.expression.Expression) ?
          options.opacity : new ol.expression.Literal(options.opacity);

};
goog.inherits(ol.style.Text, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.TextLiteral} Literal text symbolizer.
 */
ol.style.Text.prototype.createLiteral = function(opt_feature) {
  var attrs,
      feature = opt_feature;
  if (goog.isDef(feature)) {
    attrs = feature.getAttributes();
  }

  var color = this.color_.evaluate(attrs, null, feature);
  goog.asserts.assertString(color, 'color must be a string');

  var fontFamily = this.fontFamily_.evaluate(attrs, null, feature);
  goog.asserts.assertString(fontFamily, 'fontFamily must be a string');

  var fontSize = this.fontSize_.evaluate(attrs, null, feature);
  goog.asserts.assertNumber(fontSize, 'fontSize must be a number');

  var text = this.text_.evaluate(attrs, null, feature);
  goog.asserts.assertString(text, 'text must be a string');

  var opacity = this.opacity_.evaluate(attrs, null, feature);
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
 * @type {ol.style.TextLiteral}
 */
ol.style.TextDefaults = new ol.style.TextLiteral({
  color: '#000',
  fontFamily: 'sans-serif',
  fontSize: 10,
  text: '',
  opacity: 1
});
