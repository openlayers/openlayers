goog.provide('ol.style.Shape');
goog.provide('ol.style.ShapeLiteral');
goog.provide('ol.style.ShapeType');

goog.require('goog.asserts');
goog.require('ol.Expression');
goog.require('ol.ExpressionLiteral');
goog.require('ol.style.Point');
goog.require('ol.style.PointLiteral');


/**
 * @enum {string}
 */
ol.style.ShapeType = {
  CIRCLE: 'circle'
};


/**
 * @typedef {{type: (ol.style.ShapeType),
 *            size: (number),
 *            fillColor: (string|undefined),
 *            strokeColor: (string|undefined),
 *            strokeWidth: (number|undefined),
 *            opacity: (number)}}
 */
ol.style.ShapeLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.PointLiteral}
 * @param {ol.style.ShapeLiteralOptions} options Shape literal options.
 */
ol.style.ShapeLiteral = function(options) {

  goog.asserts.assertString(options.type, 'type must be a string');
  /** @type {ol.style.ShapeType} */
  this.type = options.type;

  goog.asserts.assertNumber(options.size, 'size must be a number');
  /** @type {number} */
  this.size = options.size;

  /** @type {string|undefined} */
  this.fillColor = options.fillColor;
  if (goog.isDef(options.fillColor)) {
    goog.asserts.assertString(options.fillColor, 'fillColor must be a string');
  }

  /** @type {string|undefined} */
  this.strokeColor = options.strokeColor;
  if (goog.isDef(this.strokeColor)) {
    goog.asserts.assertString(
        this.strokeColor, 'strokeColor must be a string');
  }

  /** @type {number|undefined} */
  this.strokeWidth = options.strokeWidth;
  if (goog.isDef(this.strokeWidth)) {
    goog.asserts.assertNumber(
        this.strokeWidth, 'strokeWidth must be a number');
  }

  goog.asserts.assert(
      goog.isDef(this.fillColor) ||
      (goog.isDef(this.strokeColor) && goog.isDef(this.strokeWidth)),
      'Either fillColor or strokeColor and strokeWidth must be set');

  goog.asserts.assertNumber(options.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = options.opacity;

};
goog.inherits(ol.style.ShapeLiteral, ol.style.PointLiteral);


/**
 * @inheritDoc
 */
ol.style.ShapeLiteral.prototype.equals = function(shapeLiteral) {
  return this.type == shapeLiteral.type &&
      this.size == shapeLiteral.size &&
      this.fillColor == shapeLiteral.fillColor &&
      this.strokeColor == shapeLiteral.strokeColor &&
      this.strokeWidth == shapeLiteral.strokeWidth &&
      this.opacity == shapeLiteral.opacity;
};



/**
 * @constructor
 * @extends {ol.style.Point}
 * @param {ol.style.ShapeOptions} options Shape options.
 */
ol.style.Shape = function(options) {

  /**
   * @type {ol.style.ShapeType}
   * @private
   */
  this.type_ = /** @type {ol.style.ShapeType} */ (goog.isDef(options.type) ?
      options.type : ol.style.ShapeDefaults.type);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.size_ = !goog.isDef(options.size) ?
      new ol.ExpressionLiteral(ol.style.ShapeDefaults.size) :
      (options.size instanceof ol.Expression) ?
          options.size : new ol.ExpressionLiteral(options.size);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.fillColor_ = !goog.isDefAndNotNull(options.fillColor) ?
      null :
      (options.fillColor instanceof ol.Expression) ?
          options.fillColor : new ol.ExpressionLiteral(options.fillColor);

  // stroke handling - if any stroke property is supplied, use defaults
  var strokeColor = null,
      strokeWidth = null;

  if (goog.isDefAndNotNull(options.strokeColor) ||
      goog.isDefAndNotNull(options.strokeWidth)) {

    strokeColor = !goog.isDefAndNotNull(options.strokeColor) ?
        new ol.ExpressionLiteral(ol.style.ShapeDefaults.strokeColor) :
        (options.strokeColor instanceof ol.Expression) ?
            options.strokeColor : new ol.ExpressionLiteral(options.strokeColor);

    strokeWidth = !goog.isDef(options.strokeWidth) ?
        new ol.ExpressionLiteral(ol.style.ShapeDefaults.strokeWidth) :
        (options.strokeWidth instanceof ol.Expression) ?
            options.strokeWidth : new ol.ExpressionLiteral(options.strokeWidth);
  }

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeColor_ = strokeColor;

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeWidth_ = strokeWidth;

  // one of stroke or fill can be null, both null is user error
  goog.asserts.assert(!goog.isNull(this.fillColor_) ||
      !(goog.isNull(this.strokeColor_) && goog.isNull(this.strokeWidth_)),
      'Stroke or fill properties must be provided');

  /**
   * @type {ol.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.ExpressionLiteral(ol.style.ShapeDefaults.opacity) :
      (options.opacity instanceof ol.Expression) ?
          options.opacity : new ol.ExpressionLiteral(options.opacity);

};


/**
 * @inheritDoc
 * @return {ol.style.ShapeLiteral} Literal shape symbolizer.
 */
ol.style.Shape.prototype.createLiteral = function(opt_feature) {
  var attrs,
      feature = opt_feature;
  if (goog.isDef(feature)) {
    attrs = feature.getAttributes();
  }

  var size = this.size_.evaluate(feature, attrs);
  goog.asserts.assertNumber(size, 'size must be a number');

  var fillColor = goog.isNull(this.fillColor_) ?
      undefined :
      /** @type {string} */ (this.fillColor_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(fillColor) || goog.isString(fillColor));

  var strokeColor = goog.isNull(this.strokeColor_) ?
      undefined :
      /** @type {string} */ (this.strokeColor_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(strokeColor) || goog.isString(strokeColor));

  var strokeWidth = goog.isNull(this.strokeWidth_) ?
      undefined :
      /** @type {number} */ (this.strokeWidth_.evaluate(feature, attrs));
  goog.asserts.assert(!goog.isDef(strokeWidth) || goog.isNumber(strokeWidth));

  goog.asserts.assert(
      goog.isDef(fillColor) ||
      (goog.isDef(strokeColor) && goog.isDef(strokeWidth)),
      'either fill style or strokeColor and strokeWidth must be defined');

  var opacity = this.opacity_.evaluate(feature, attrs);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.ShapeLiteral({
    type: this.type_,
    size: size,
    fillColor: fillColor,
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    opacity: opacity
  });
};


/**
 * @type {ol.style.ShapeLiteral}
 */
ol.style.ShapeDefaults = new ol.style.ShapeLiteral({
  type: ol.style.ShapeType.CIRCLE,
  size: 5,
  fillColor: '#ffffff',
  strokeColor: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
