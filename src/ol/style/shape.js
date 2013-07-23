goog.provide('ol.style.Shape');
goog.provide('ol.style.ShapeLiteral');
goog.provide('ol.style.ShapeType');

goog.require('goog.asserts');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
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
   * @type {ol.expr.Expression}
   * @private
   */
  this.size_ = !goog.isDef(options.size) ?
      new ol.expr.Literal(ol.style.ShapeDefaults.size) :
      (options.size instanceof ol.expr.Expression) ?
          options.size : new ol.expr.Literal(options.size);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.fillColor_ = !goog.isDefAndNotNull(options.fillColor) ?
      null :
      (options.fillColor instanceof ol.expr.Expression) ?
          options.fillColor : new ol.expr.Literal(options.fillColor);

  // stroke handling - if any stroke property is supplied, use defaults
  var strokeColor = null,
      strokeWidth = null;

  if (goog.isDefAndNotNull(options.strokeColor) ||
      goog.isDefAndNotNull(options.strokeWidth)) {

    if (goog.isDefAndNotNull(options.strokeColor)) {
      strokeColor = (options.strokeColor instanceof ol.expr.Expression) ?
          options.strokeColor :
          new ol.expr.Literal(options.strokeColor);
    } else {
      strokeColor = new ol.expr.Literal(
          /** @type {string} */ (ol.style.ShapeDefaults.strokeColor));
    }

    if (goog.isDefAndNotNull(options.strokeWidth)) {
      strokeWidth = (options.strokeWidth instanceof ol.expr.Expression) ?
          options.strokeWidth :
          new ol.expr.Literal(options.strokeWidth);
    } else {
      strokeWidth = new ol.expr.Literal(
          /** @type {number} */ (ol.style.ShapeDefaults.strokeWidth));
    }

  }

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeColor_ = strokeColor;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeWidth_ = strokeWidth;

  // one of stroke or fill can be null, both null is user error
  goog.asserts.assert(!goog.isNull(this.fillColor_) ||
      !(goog.isNull(this.strokeColor_) && goog.isNull(this.strokeWidth_)),
      'Stroke or fill properties must be provided');

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.opacity_ = !goog.isDef(options.opacity) ?
      new ol.expr.Literal(ol.style.ShapeDefaults.opacity) :
      (options.opacity instanceof ol.expr.Expression) ?
          options.opacity : new ol.expr.Literal(options.opacity);

};


/**
 * @inheritDoc
 * @return {ol.style.ShapeLiteral} Literal shape symbolizer.
 */
ol.style.Shape.prototype.createLiteral = function(opt_feature) {

  var size = ol.expr.evaluateFeature(this.size_, opt_feature);
  goog.asserts.assertNumber(size, 'size must be a number');

  var fillColor;
  if (!goog.isNull(this.fillColor_)) {
    fillColor = ol.expr.evaluateFeature(this.fillColor_, opt_feature);
    goog.asserts.assertString(fillColor, 'fillColor must be a string');
  }

  var strokeColor;
  if (!goog.isNull(this.strokeColor_)) {
    strokeColor = ol.expr.evaluateFeature(this.strokeColor_, opt_feature);
    goog.asserts.assertString(strokeColor, 'strokeColor must be a string');
  }

  var strokeWidth;
  if (!goog.isNull(this.strokeWidth_)) {
    strokeWidth = ol.expr.evaluateFeature(this.strokeWidth_, opt_feature);
    goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');
  }

  goog.asserts.assert(
      goog.isDef(fillColor) ||
      (goog.isDef(strokeColor) && goog.isDef(strokeWidth)),
      'either fillColor or strokeColor and strokeWidth must be defined');

  var opacity = ol.expr.evaluateFeature(this.opacity_, opt_feature);
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
 * Get the fill color.
 * @return {ol.expr.Expression} Fill color.
 */
ol.style.Shape.prototype.getFillColor = function() {
  return this.fillColor_;
};


/**
 * Get the opacity.
 * @return {ol.expr.Expression} Opacity.
 */
ol.style.Shape.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Get the shape size.
 * @return {ol.expr.Expression} Shape size.
 */
ol.style.Shape.prototype.getSize = function() {
  return this.size_;
};


/**
 * Get the stroke color.
 * @return {ol.expr.Expression} Stroke color.
 */
ol.style.Shape.prototype.getStrokeColor = function() {
  return this.strokeColor_;
};


/**
 * Get the stroke width.
 * @return {ol.expr.Expression} Stroke width.
 */
ol.style.Shape.prototype.getStrokeWidth = function() {
  return this.strokeWidth_;
};


/**
 * Get the shape type.
 * @return {ol.style.ShapeType} Shape type.
 */
ol.style.Shape.prototype.getType = function() {
  return this.type_;
};


/**
 * Set the fill color.
 * @param {ol.expr.Expression} fillColor Fill color.
 */
ol.style.Shape.prototype.setFillColor = function(fillColor) {
  goog.asserts.assertInstanceof(fillColor, ol.expr.Expression);
  this.fillColor_ = fillColor;
};


/**
 * Set the opacity.
 * @param {ol.expr.Expression} opacity Opacity.
 */
ol.style.Shape.prototype.setOpacity = function(opacity) {
  goog.asserts.assertInstanceof(opacity, ol.expr.Expression);
  this.opacity_ = opacity;
};


/**
 * Set the shape size.
 * @param {ol.expr.Expression} size Shape size.
 */
ol.style.Shape.prototype.setSize = function(size) {
  goog.asserts.assertInstanceof(size, ol.expr.Expression);
  this.size_ = size;
};


/**
 * Set the stroke color.
 * @param {ol.expr.Expression} strokeColor Stroke color.
 */
ol.style.Shape.prototype.setStrokeColor = function(strokeColor) {
  goog.asserts.assertInstanceof(strokeColor, ol.expr.Expression);
  this.strokeColor_ = strokeColor;
};


/**
 * Set the stroke width.
 * @param {ol.expr.Expression} strokeWidth Stroke width.
 */
ol.style.Shape.prototype.setStrokeWidth = function(strokeWidth) {
  goog.asserts.assertInstanceof(strokeWidth, ol.expr.Expression);
  this.strokeWidth_ = strokeWidth;
};


/**
 * Set the shape type.
 * @param {ol.style.ShapeType} type Shape type.
 */
ol.style.Shape.prototype.setType = function(type) {
  this.type_ = type;
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
