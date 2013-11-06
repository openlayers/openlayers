goog.provide('ol.style.Shape');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.Fill');
goog.require('ol.style.Point');
goog.require('ol.style.ShapeLiteral');
goog.require('ol.style.ShapeType');
goog.require('ol.style.Stroke');



/**
 * @constructor
 * @extends {ol.style.Point}
 * @param {ol.style.ShapeOptions} options Shape options.
 * @todo stability experimental
 */
ol.style.Shape = function(options) {
  goog.base(this);

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

  /**
   * @type {ol.style.Fill}
   * @private
   */
  this.fill_ = goog.isDefAndNotNull(options.fill) ? options.fill : null;

  /**
   * @type {ol.style.Stroke}
   * @private
   */
  this.stroke_ = goog.isDefAndNotNull(options.stroke) ? options.stroke : null;

  // one of stroke or fill can be null, both null is user error
  goog.asserts.assert(this.fill_ || this.stroke_,
      'Stroke or fill must be provided');

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.zIndex_ = !goog.isDefAndNotNull(options.zIndex) ?
      new ol.expr.Literal(ol.style.ShapeDefaults.zIndex) :
      (options.zIndex instanceof ol.expr.Expression) ?
          options.zIndex : new ol.expr.Literal(options.zIndex);

};
goog.inherits(ol.style.Shape, ol.style.Point);


/**
 * @inheritDoc
 * @return {ol.style.ShapeLiteral} Literal shape symbolizer.
 */
ol.style.Shape.prototype.createLiteral = function(featureOrType) {
  var feature, type;
  if (featureOrType instanceof ol.Feature) {
    feature = featureOrType;
    var geometry = feature.getGeometry();
    type = geometry ? geometry.getType() : null;
  } else {
    type = featureOrType;
  }

  var literal = null;
  if (type === ol.geom.GeometryType.POINT ||
      type === ol.geom.GeometryType.MULTIPOINT) {
    var size = Number(ol.expr.evaluateFeature(this.size_, feature));
    goog.asserts.assert(!isNaN(size), 'size must be a number');

    var fillColor, fillOpacity;
    if (!goog.isNull(this.fill_)) {
      fillColor = ol.expr.evaluateFeature(this.fill_.getColor(), feature);
      goog.asserts.assertString(
          fillColor, 'fillColor must be a string');
      fillOpacity = Number(ol.expr.evaluateFeature(
          this.fill_.getOpacity(), feature));
      goog.asserts.assert(!isNaN(fillOpacity), 'fillOpacity must be a number');
    }

    var strokeColor, strokeOpacity, strokeWidth;
    if (!goog.isNull(this.stroke_)) {
      strokeColor = ol.expr.evaluateFeature(this.stroke_.getColor(), feature);
      goog.asserts.assertString(
          strokeColor, 'strokeColor must be a string');
      strokeOpacity = Number(ol.expr.evaluateFeature(
          this.stroke_.getOpacity(), feature));
      goog.asserts.assert(!isNaN(strokeOpacity),
          'strokeOpacity must be a number');
      strokeWidth = Number(ol.expr.evaluateFeature(
          this.stroke_.getWidth(), feature));
      goog.asserts.assert(!isNaN(strokeWidth), 'strokeWidth must be a number');
    }

    var zIndex = Number(ol.expr.evaluateFeature(this.zIndex_, feature));
    goog.asserts.assert(!isNaN(zIndex), 'zIndex must be a number');

    literal = new ol.style.ShapeLiteral({
      type: this.type_,
      size: size,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
      strokeColor: strokeColor,
      strokeOpacity: strokeOpacity,
      strokeWidth: strokeWidth,
      zIndex: zIndex
    });
  }

  return literal;
};


/**
 * Get the fill.
 * @return {ol.style.Fill} Shape fill.
 */
ol.style.Shape.prototype.getFill = function() {
  return this.fill_;
};


/**
 * Get the shape size.
 * @return {ol.expr.Expression} Shape size.
 */
ol.style.Shape.prototype.getSize = function() {
  return this.size_;
};


/**
 * Get the stroke.
 * @return {ol.style.Stroke} Shape stroke.
 */
ol.style.Shape.prototype.getStroke = function() {
  return this.stroke_;
};


/**
 * Get the shape type.
 * @return {ol.style.ShapeType} Shape type.
 */
ol.style.Shape.prototype.getType = function() {
  return this.type_;
};


/**
 * Get the shape zIndex.
 * @return {ol.expr.Expression} Shape zIndex.
 */
ol.style.Shape.prototype.getZIndex = function() {
  return this.zIndex_;
};


/**
 * Set the fill.
 * @param {ol.style.Fill} fill Shape fill.
 */
ol.style.Shape.prototype.setFill = function(fill) {
  if (!goog.isNull(fill)) {
    goog.asserts.assertInstanceof(fill, ol.style.Fill);
  }
  this.fill_ = fill;
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
 * Set the stroke.
 * @param {ol.style.Stroke} stroke Shape stroke.
 */
ol.style.Shape.prototype.setStroke = function(stroke) {
  if (!goog.isNull(stroke)) {
    goog.asserts.assertInstanceof(stroke, ol.style.Stroke);
  }
  this.stroke_ = stroke;
};


/**
 * Set the shape type.
 * @param {ol.style.ShapeType} type Shape type.
 */
ol.style.Shape.prototype.setType = function(type) {
  this.type_ = type;
};


/**
 * Set the shape zIndex.
 * @param {ol.expr.Expression} zIndex Shape zIndex.
 */
ol.style.Shape.prototype.setZIndex = function(zIndex) {
  goog.asserts.assertInstanceof(zIndex, ol.expr.Expression);
  this.zIndex_ = zIndex;
};


/**
 * @typedef {{type: ol.style.ShapeType,
 *            size: number,
 *            zIndex: number}}
 */
ol.style.ShapeDefaults = {
  type: ol.style.ShapeType.CIRCLE,
  size: 5,
  zIndex: 0
};
