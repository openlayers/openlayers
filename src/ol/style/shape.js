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
 *            fillOpacity: (number|undefined),
 *            strokeColor: (string|undefined),
 *            strokeOpacity: (number|undefined),
 *            strokeWidth: (number|undefined)}}
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

  /** @type {number|undefined} */
  this.fillOpacity = options.fillOpacity;
  if (goog.isDef(options.fillOpacity)) {
    goog.asserts.assertNumber(
        options.fillOpacity, 'fillOpacity must be a number');
  }

  /** @type {string|undefined} */
  this.strokeColor = options.strokeColor;
  if (goog.isDef(this.strokeColor)) {
    goog.asserts.assertString(
        this.strokeColor, 'strokeColor must be a string');
  }

  /** @type {number|undefined} */
  this.strokeOpacity = options.strokeOpacity;
  if (goog.isDef(this.strokeOpacity)) {
    goog.asserts.assertNumber(
        this.strokeOpacity, 'strokeOpacity must be a number');
  }

  /** @type {number|undefined} */
  this.strokeWidth = options.strokeWidth;
  if (goog.isDef(this.strokeWidth)) {
    goog.asserts.assertNumber(
        this.strokeWidth, 'strokeWidth must be a number');
  }

  // fill and/or stroke properties must be defined
  var fillDef = goog.isDef(this.fillColor) && goog.isDef(this.fillOpacity);
  var strokeDef = goog.isDef(this.strokeColor) &&
      goog.isDef(this.strokeOpacity) &&
      goog.isDef(this.strokeWidth);
  goog.asserts.assert(fillDef || strokeDef,
      'Either fillColor and fillOpacity or ' +
      'strokeColor and strokeOpacity and strokeWidth must be set');

};
goog.inherits(ol.style.ShapeLiteral, ol.style.PointLiteral);


/**
 * @inheritDoc
 */
ol.style.ShapeLiteral.prototype.equals = function(shapeLiteral) {
  return this.type == shapeLiteral.type &&
      this.size == shapeLiteral.size &&
      this.fillColor == shapeLiteral.fillColor &&
      this.fillOpacity == shapeLiteral.fillOpacity &&
      this.strokeColor == shapeLiteral.strokeColor &&
      this.strokeOpacity == shapeLiteral.strokeOpacity &&
      this.strokeWidth == shapeLiteral.strokeWidth;
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
  this.size_ = !goog.isDefAndNotNull(options.size) ?
      new ol.expr.Literal(ol.style.ShapeDefaults.size) :
      (options.size instanceof ol.expr.Expression) ?
          options.size : new ol.expr.Literal(options.size);

  // fill handling - if any fill property is supplied, use all defaults
  var fillColor = null,
      fillOpacity = null;

  if (goog.isDefAndNotNull(options.fillColor) ||
      goog.isDefAndNotNull(options.fillOpacity)) {

    if (goog.isDefAndNotNull(options.fillColor)) {
      fillColor = (options.fillColor instanceof ol.expr.Expression) ?
          options.fillColor :
          new ol.expr.Literal(options.fillColor);
    } else {
      fillColor = new ol.expr.Literal(
          /** @type {string} */ (ol.style.ShapeDefaults.fillColor));
    }

    if (goog.isDefAndNotNull(options.fillOpacity)) {
      fillOpacity = (options.fillOpacity instanceof ol.expr.Expression) ?
          options.fillOpacity :
          new ol.expr.Literal(options.fillOpacity);
    } else {
      fillOpacity = new ol.expr.Literal(
          /** @type {number} */ (ol.style.ShapeDefaults.fillOpacity));
    }

  }

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.fillColor_ = fillColor;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.fillOpacity_ = fillOpacity;


  // stroke handling - if any stroke property is supplied, use defaults
  var strokeColor = null,
      strokeOpacity = null,
      strokeWidth = null;

  if (goog.isDefAndNotNull(options.strokeColor) ||
      goog.isDefAndNotNull(options.strokeOpacity) ||
      goog.isDefAndNotNull(options.strokeWidth)) {

    if (goog.isDefAndNotNull(options.strokeColor)) {
      strokeColor = (options.strokeColor instanceof ol.expr.Expression) ?
          options.strokeColor :
          new ol.expr.Literal(options.strokeColor);
    } else {
      strokeColor = new ol.expr.Literal(
          /** @type {string} */ (ol.style.ShapeDefaults.strokeColor));
    }

    if (goog.isDefAndNotNull(options.strokeOpacity)) {
      strokeOpacity = (options.strokeOpacity instanceof ol.expr.Expression) ?
          options.strokeOpacity :
          new ol.expr.Literal(options.strokeOpacity);
    } else {
      strokeOpacity = new ol.expr.Literal(
          /** @type {number} */ (ol.style.ShapeDefaults.strokeOpacity));
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
  this.strokeOpacity_ = strokeOpacity;

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.strokeWidth_ = strokeWidth;

  // one of stroke or fill can be null, both null is user error
  var fill = !goog.isNull(this.fillColor_) && !goog.isNull(this.fillOpacity_);
  var stroke = !goog.isNull(this.strokeColor_) &&
      !goog.isNull(this.strokeOpacity_) &&
      !goog.isNull(this.strokeWidth_);
  goog.asserts.assert(fill || stroke,
      'Stroke or fill properties must be provided');

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

  var fillOpacity;
  if (!goog.isNull(this.fillOpacity_)) {
    fillOpacity = ol.expr.evaluateFeature(this.fillOpacity_, opt_feature);
    goog.asserts.assertNumber(fillOpacity, 'fillOpacity must be a number');
  }

  var strokeColor;
  if (!goog.isNull(this.strokeColor_)) {
    strokeColor = ol.expr.evaluateFeature(this.strokeColor_, opt_feature);
    goog.asserts.assertString(strokeColor, 'strokeColor must be a string');
  }

  var strokeOpacity;
  if (!goog.isNull(this.strokeOpacity_)) {
    strokeOpacity = ol.expr.evaluateFeature(this.strokeOpacity_, opt_feature);
    goog.asserts.assertNumber(strokeOpacity, 'strokeOpacity must be a number');
  }

  var strokeWidth;
  if (!goog.isNull(this.strokeWidth_)) {
    strokeWidth = ol.expr.evaluateFeature(this.strokeWidth_, opt_feature);
    goog.asserts.assertNumber(strokeWidth, 'strokeWidth must be a number');
  }

  var fill = goog.isDef(fillColor) && goog.isDef(fillOpacity);
  var stroke = goog.isDef(strokeColor) && goog.isDef(strokeOpacity) &&
      goog.isDef(strokeWidth);

  goog.asserts.assert(fill || stroke,
      'either fill or stroke properties must be defined');

  return new ol.style.ShapeLiteral({
    type: this.type_,
    size: size,
    fillColor: fillColor,
    fillOpacity: fillOpacity,
    strokeColor: strokeColor,
    strokeOpacity: strokeOpacity,
    strokeWidth: strokeWidth
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
 * Get the fill opacity.
 * @return {ol.expr.Expression} Fill opacity.
 */
ol.style.Shape.prototype.getFillOpacity = function() {
  return this.fillOpacity_;
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
 * Get the stroke opacity.
 * @return {ol.expr.Expression} Stroke opacity.
 */
ol.style.Shape.prototype.getStrokeOpacity = function() {
  return this.strokeOpacity_;
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
 * Set the fill opacity.
 * @param {ol.expr.Expression} fillOpacity Fill opacity.
 */
ol.style.Shape.prototype.setFillOpacity = function(fillOpacity) {
  goog.asserts.assertInstanceof(fillOpacity, ol.expr.Expression);
  this.fillOpacity_ = fillOpacity;
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
 * Set the stroke opacity.
 * @param {ol.expr.Expression} strokeOpacity Stroke opacity.
 */
ol.style.Shape.prototype.setStrokeOpacity = function(strokeOpacity) {
  goog.asserts.assertInstanceof(strokeOpacity, ol.expr.Expression);
  this.strokeOpacity_ = strokeOpacity;
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
  fillOpacity: 0.4,
  strokeColor: '#696969',
  strokeOpacity: 0.8,
  strokeWidth: 1.5
});
