goog.provide('ol.style.Text');
goog.provide('ol.style.TextLiteral');

goog.require('goog.asserts');
goog.require('ol.Expression');
goog.require('ol.ExpressionLiteral');
goog.require('ol.style.Symbolizer');
goog.require('ol.style.SymbolizerLiteral');


/**
 * @typedef {{color: (string|undefined),
 *            fontFamily: (string|undefined),
 *            fontSize: number,
 *            name: string,
 *            opacity: number}}
 */
ol.style.TextLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.SymbolizerLiteral}
 * @param {ol.style.TextLiteralOptions} options Text literal options.
 */
ol.style.TextLiteral = function(options) {

  /** @type {string|undefined} */
  this.color = options.color;
  if (goog.isDef(options.color)) {
    goog.asserts.assertString(options.color, 'color must be a string');
  }

  /** @type {string|undefined} */
  this.fontFamily = options.fontFamily;
  if (goog.isDef(options.fontFamily)) {
    goog.asserts.assertString(options.fontFamily,
        'fontFamily must be a string');
  }

  goog.asserts.assertNumber(options.fontSize, 'fontSize must be a number');
  /** @type {number} */
  this.fontSize = options.fontSize;

  goog.asserts.assertString(options.name, 'name must be a string');
  /** @type {string} */
  this.name = options.name;

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
   * @type {ol.Expression}
   * @private
   */
  this.color_ = !goog.isDef(options.color) ?
      null :
      (options.color instanceof ol.Expression) ?
          options.color : new ol.ExpressionLiteral(options.color);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.fontFamily_ = !goog.isDefAndNotNull(options.fontFamily) ?
      null :
      (options.fontFamily instanceof ol.Expression) ?
          options.fontFamily : new ol.ExpressionLiteral(options.fontFamily);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.fontSize_ = !goog.isDefAndNotNull(options.fontSize) ?
      null :
      (options.fontSize instanceof ol.Expression) ?
          options.fontSize : new ol.ExpressionLiteral(options.fontSize);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.name_ = (options.name instanceof ol.Expression) ?
      options.name : new ol.ExpressionLiteral(options.name);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.ExpressionLiteral(ol.style.TextDefaults.opacity) :
      (options.opacity instanceof ol.Expression) ?
          options.opacity : new ol.ExpressionLiteral(options.opacity);

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

  var color = goog.isNull(this.color_) ?
      undefined :
      /** @type {string} */ (this.color_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(color) || goog.isString(color));

  var fontFamily = goog.isNull(this.fontFamily_) ?
      undefined :
      /** @type {string} */ (this.fontFamily_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(fontFamily) || goog.isString(fontFamily));

  var fontSize = this.fontSize_.evaluate(feature, attrs);
  goog.asserts.assertNumber(fontSize, 'fontSize must be a number');

  var name = this.name_.evaluate(feature, attrs);
  goog.asserts.assertString(name, 'name must be a string');

  var opacity = this.opacity_.evaluate(feature, attrs);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.TextLiteral({
    color: color,
    fontFamily: fontFamily,
    fontSize: fontSize,
    name: name,
    opacity: opacity
  });
};


/**
 * @type {ol.style.TextLiteral}
 */
ol.style.TextDefaults = new ol.style.TextLiteral({
  fontSize: 10,
  name: '',
  opacity: 1
});
