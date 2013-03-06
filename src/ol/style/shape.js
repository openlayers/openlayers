goog.provide('ol.style.Shape');
goog.provide('ol.style.ShapeLiteral');
goog.provide('ol.style.ShapeType');

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
 *            fillStyle: (string|undefined),
 *            strokeStyle: (string|undefined),
 *            strokeWidth: (number|undefined),
 *            opacity: (number)}}
 */
ol.style.ShapeLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.PointLiteral}
 * @param {ol.style.ShapeLiteralOptions} config Symbolizer properties.
 */
ol.style.ShapeLiteral = function(config) {

  goog.asserts.assertString(config.type, 'type must be a string');
  /** @type {ol.style.ShapeType} */
  this.type = config.type;

  goog.asserts.assertNumber(config.size, 'size must be a number');
  /** @type {number} */
  this.size = config.size;

  /** @type {string|undefined} */
  this.fillStyle = config.fillStyle;
  if (goog.isDef(config.fillStyle)) {
    goog.asserts.assertString(config.fillStyle, 'fillStyle must be a string');
  }

  /** @type {string|undefined} */
  this.strokeStyle = config.strokeStyle;
  if (goog.isDef(this.strokeStyle)) {
    goog.asserts.assertString(
        this.strokeStyle, 'strokeStyle must be a string');
  }

  /** @type {number|undefined} */
  this.strokeWidth = config.strokeWidth;
  if (goog.isDef(this.strokeWidth)) {
    goog.asserts.assertNumber(
        this.strokeWidth, 'strokeWidth must be a number');
  }

  goog.asserts.assert(
      goog.isDef(this.fillStyle) ||
      (goog.isDef(this.strokeStyle) && goog.isDef(this.strokeWidth)),
      'Either fillStyle or strokeStyle and strokeWidth must be set');

  goog.asserts.assertNumber(config.opacity, 'opacity must be a number');
  /** @type {number} */
  this.opacity = config.opacity;

};
goog.inherits(ol.style.ShapeLiteral, ol.style.PointLiteral);


/**
 * @inheritDoc
 */
ol.style.ShapeLiteral.prototype.equals = function(shapeLiteral) {
  return this.type == shapeLiteral.type &&
      this.size == shapeLiteral.size &&
      this.fillStyle == shapeLiteral.fillStyle &&
      this.strokeStyle == shapeLiteral.strokeStyle &&
      this.strokeWidth == shapeLiteral.strokeWidth &&
      this.opacity == shapeLiteral.opacity;
};



/**
 * @constructor
 * @extends {ol.style.Point}
 * @param {ol.style.ShapeOptions} options Symbolizer properties.
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
  this.fillStyle_ = !goog.isDefAndNotNull(options.fillStyle) ?
      null :
      (options.fillStyle instanceof ol.Expression) ?
          options.fillStyle : new ol.ExpressionLiteral(options.fillStyle);

  // stroke handling - if any stroke property is supplied, use defaults
  var strokeStyle = null,
      strokeWidth = null;

  if (goog.isDefAndNotNull(options.strokeStyle) ||
      goog.isDefAndNotNull(options.strokeWidth)) {

    strokeStyle = !goog.isDefAndNotNull(options.strokeStyle) ?
        new ol.ExpressionLiteral(ol.style.ShapeDefaults.strokeStyle) :
        (options.strokeStyle instanceof ol.Expression) ?
            options.strokeStyle : new ol.ExpressionLiteral(options.strokeStyle);

    strokeWidth = !goog.isDef(options.strokeWidth) ?
        new ol.ExpressionLiteral(ol.style.ShapeDefaults.strokeWidth) :
        (options.strokeWidth instanceof ol.Expression) ?
            options.strokeWidth : new ol.ExpressionLiteral(options.strokeWidth);
  }

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeStyle_ = strokeStyle;

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeWidth_ = strokeWidth;

  // one of stroke or fill can be null, both null is user error
  goog.asserts.assert(!goog.isNull(this.fillStyle_) ||
      !(goog.isNull(this.strokeStyle_) && goog.isNull(this.strokeWidth_)),
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

  var fillStyle = goog.isNull(this.fillStyle_) ?
      undefined : this.fillStyle_.evaluate(feature, attrs);
  goog.asserts.assert(!goog.isDef(fillStyle) || goog.isString(fillStyle));

  var strokeStyle = goog.isNull(this.strokeStyle_) ?
      undefined : this.strokeStyle_.evaluate(feature, attrs);
  goog.asserts.assert(!goog.isDef(strokeStyle) || goog.isString(strokeStyle));

  var strokeWidth = goog.isNull(this.strokeWidth_) ?
      undefined : this.strokeWidth_.evaluate(feature, attrs);
  goog.asserts.assert(!goog.isDef(strokeWidth) || goog.isNumber(strokeWidth));

  goog.asserts.assert(
      goog.isDef(fillStyle) ||
      (goog.isDef(strokeStyle) && goog.isDef(strokeWidth)),
      'either fill style or strokeStyle and strokeWidth must be defined');

  var opacity = this.opacity_.evaluate(feature, attrs);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.ShapeLiteral({
    type: this.type_,
    size: size,
    // TODO: check if typecast can be avoided here
    fillStyle: /** @type {string|undefined} */ (fillStyle),
    strokeStyle: /** @type {string|undefined} */ (strokeStyle),
    strokeWidth: /** @type {number|undefined} */ (strokeWidth),
    opacity: opacity
  });
};


/**
 * @type {ol.style.ShapeLiteral}
 */
ol.style.ShapeDefaults = new ol.style.ShapeLiteral({
  type: ol.style.ShapeType.CIRCLE,
  size: 5,
  fillStyle: '#ffffff',
  strokeStyle: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
