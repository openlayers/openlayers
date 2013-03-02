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
 *            fillStyle: (string),
 *            strokeStyle: (string),
 *            strokeWidth: (number),
 *            opacity: (number)}}
 */
ol.style.ShapeLiteralOptions;



/**
 * @constructor
 * @extends {ol.style.PointLiteral}
 * @param {ol.style.ShapeLiteralOptions} config Symbolizer properties.
 */
ol.style.ShapeLiteral = function(config) {

  /** @type {string} */
  this.type = config.type;

  /** @type {number} */
  this.size = config.size;

  /** @type {string} */
  this.fillStyle = config.fillStyle;

  /** @type {string} */
  this.strokeStyle = config.strokeStyle;

  /** @type {number} */
  this.strokeWidth = config.strokeWidth;

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
 * @typedef {{type: (ol.style.ShapeType),
 *            size: (number|ol.Expression),
 *            fillStyle: (string|ol.Expression),
 *            strokeStyle: (string|ol.Expression),
 *            strokeWidth: (number|ol.Expression),
 *            opacity: (number|ol.Expression)}}
 */
ol.style.ShapeOptions;



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
  this.type_ = /** @type {ol.style.ShapeType} */ goog.isDef(options.type) ?
      options.type : ol.style.ShapeDefaults.type;

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
  this.fillStyle_ = !goog.isDef(options.fillStyle) ?
      new ol.ExpressionLiteral(ol.style.ShapeDefaults.fillStyle) :
      (options.fillStyle instanceof ol.Expression) ?
          options.fillStyle : new ol.ExpressionLiteral(options.fillStyle);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeStyle_ = !goog.isDef(options.strokeStyle) ?
      new ol.ExpressionLiteral(ol.style.ShapeDefaults.strokeStyle) :
      (options.strokeStyle instanceof ol.Expression) ?
          options.strokeStyle : new ol.ExpressionLiteral(options.strokeStyle);

  /**
   * @type {ol.Expression}
   * @private
   */
  this.strokeWidth_ = !goog.isDef(options.strokeWidth) ?
      new ol.ExpressionLiteral(ol.style.ShapeDefaults.strokeWidth) :
      (options.strokeWidth instanceof ol.Expression) ?
          options.strokeWidth : new ol.ExpressionLiteral(options.strokeWidth);

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
ol.style.Shape.prototype.createLiteral = function(feature) {
  var attrs = feature.getAttributes();

  var size = this.size_.evaluate(feature, attrs);
  goog.asserts.assertNumber(size, 'size must be a number');

  var fillStyle = this.fillStyle_.evaluate(feature, attrs);
  goog.asserts.assertString(fillStyle, 'fillStyle must be a string');

  var strokeStyle = this.strokeStyle_.evaluate(feature, attrs);
  goog.asserts.assertString(strokeStyle, 'strokeStyle must be a string');

  var strokeWidth = this.strokeWidth_.evaluate(feature, attrs);
  goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');

  var opacity = this.opacity_.evaluate(feature, attrs);
  goog.asserts.assertNumber(opacity, 'opacity must be a number');

  return new ol.style.ShapeLiteral({
    type: this.type_,
    size: size,
    fillStyle: fillStyle,
    strokeStyle: strokeStyle,
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
  fillStyle: '#ffffff',
  strokeStyle: '#696969',
  strokeWidth: 1.5,
  opacity: 0.75
});
